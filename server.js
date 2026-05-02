const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const PORT = process.env.PORT || 3000;

const app = next({ dev, hostname, port: PORT });
const handle = app.getRequestHandler();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const userProfiles = new Map(); // userId -> profile
const activeRooms = new Map(); // roomId -> { users: Map, messages: [], metadata: {} }
const socketToUser = new Map(); // socketId -> userId
const evaporationTimers = new Map(); // roomId -> Timeout

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket']
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.warn('[Socket Auth] ⚠️ No token provided');
      return next(new Error('No token'));
    }

    try {
      // Use Supabase built-in verification (works for HS256, ES256, etc.)
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        console.error('[Socket Auth] ❌ Verification failed:', error?.message || 'User not found');
        return next(new Error('Invalid token'));
      }

      socket.data.user = { sub: user.id, email: user.email };
      console.log(`[Socket Auth] ✅ Success: ${user.email}`);
      next();
    } catch (err) { 
      console.error('[Socket Auth] ❌ Internal Error:', err.message);
      next(new Error('Authentication error')); 
    }
  });

  const getRoomMembers = async (roomId) => {
    const room = activeRooms.get(roomId);
    if (!room) return { active: [], pending: [] };
    
    // 1. Get Live Members
    const active = [];
    room.users.forEach((uId, sId) => {
      const profile = userProfiles.get(uId);
      if (profile) active.push({ ...profile, socketId: sId, isActive: true });
    });

    // 2. Get Pending Members
    const pending = [];
    room.pending?.forEach((uId, sId) => {
      const profile = userProfiles.get(uId);
      if (profile) pending.push({ ...profile, socketId: sId });
    });

    // 3. For Private Rooms, fetch Offline Approved Users (including owner)
    if (room.metadata.is_private) {
      const liveUserIds = new Set(active.map(m => m.id));
      
      // Ensure owner is always in the consideration list
      const rosterIds = new Set(room.approvedUserIds);
      if (room.metadata.created_by) rosterIds.add(room.metadata.created_by);
      
      const offlineIds = Array.from(rosterIds).filter(id => !liveUserIds.has(id));

      if (offlineIds.length > 0) {
        const { data: offlineProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', offlineIds);
          
        const offline = (offlineProfiles || []).map(p => ({
          ...p,
          isActive: false
        }));
        
        return { active: [...active, ...offline], pending };
      }
    }

    return { active, pending };
  };

  io.on('connection', async (socket) => {
    const userId = socket.data.user.sub;
    console.log(`[Socket] User connecting: ${userId}`);
    
    // Helper to get a Supabase client authorized as this user
    const getUserSupabase = () => createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${socket.handshake.auth.token}` } } }
    );

    const userSupabase = getUserSupabase();
    const { data: profile, error: profileErr } = await userSupabase.from('profiles').select('*').eq('id', userId).single();
    
    if (profileErr || !profile) {
      console.error(`[Socket] Profile fetch error for ${userId}:`, profileErr);
      return socket.disconnect();
    }

    userProfiles.set(userId, profile);
    socketToUser.set(socket.id, userId);
    console.log(`[Socket] User authenticated: ${profile.username}`);

    socket.on('room:join', async ({ roomId, code }) => {
      const sRoomId = String(roomId); // 🛡️ Normalize ID type
      
      // Cleanup existing room memberships (Strict Decoupling)
      for (const [rId, room] of activeRooms.entries()) {
        if (room.users.has(socket.id)) {
          room.users.delete(socket.id);
          socket.leave(rId); 
          const members = await getRoomMembers(rId);
          io.to(rId).emit('room:members', members);
        }
      }

      let room = activeRooms.get(sRoomId);
      
      try {
        const { data: dbRoom } = await supabase.from('rooms').select('*').eq('id', sRoomId).single();
        if (!dbRoom && !['general', 'tech-talk', 'ai-lounge'].includes(sRoomId.toLowerCase())) {
          return socket.emit('error', { message: 'Room not found' });
        }

        if (!room) {
          console.log(`[Socket] 🏗️ Initializing Persistence for Room: ${sRoomId}`);
          const isGlobal = ['general', 'tech-talk', 'ai-lounge'].includes(sRoomId.toLowerCase());
          room = { 
            users: new Map(), 
            messages: [], 
            metadata: dbRoom || { id: sRoomId, name: sRoomId, is_private: false },
            pending: new Map(),
            approvedUserIds: new Set(dbRoom?.approved_ids || []) 
          };
          activeRooms.set(sRoomId, room);
        }

        // Security check for private rooms
        if (room.metadata.is_private && room.metadata.created_by !== userId) {
          // 🛡️ PERMANENT CHECK: Check DB-synced approvals
          const isTrusted = room.approvedUserIds.has(userId);
          
          if (!isTrusted) {
            if (!code || !await bcrypt.compare(code, room.metadata.code_hash)) {
              return socket.emit('error', { message: 'Invalid join code' });
            }
            
            room.pending.set(socket.id, userId);
            socket.join(sRoomId);
            io.to(sRoomId).emit('room:members', await getRoomMembers(sRoomId));
            return socket.emit('room:pending', { roomId: sRoomId });
          }
        }

        // Normal Join
        room.users.set(socket.id, userId);
        socket.join(sRoomId);
        io.to(sRoomId).emit('room:members', await getRoomMembers(sRoomId));
        
        // 🔍 DEEP LOGGING: Check history integrity
        const imgCount = room.messages.filter(m => !!m.image).length;
        console.log(`[Socket] 📜 Sending History for ${sRoomId}: ${room.messages.length} msgs (${imgCount} images)`);
        
        socket.emit('room:history', { messages: room.messages, metadata: room.metadata });
      } catch (err) {
        console.error('[Socket] Join Error:', err);
        socket.emit('error', { message: 'Internal joining error' });
      }
    });

    socket.on('room:approve', async ({ roomId, targetSocketId }) => {
      const room = activeRooms.get(roomId);
      if (!room || room.metadata.created_by !== userId) return;
      
      const targetUserId = room.pending.get(targetSocketId);
      if (targetUserId) {
        room.pending.delete(targetSocketId);
        room.users.set(targetSocketId, targetUserId);
        
        // 🌟 PERMANENT APPROVAL: Update DB and Memory
        room.approvedUserIds.add(targetUserId);
        const { data: currentRoom } = await supabase.from('rooms').select('approved_ids').eq('id', roomId).single();
        const updatedIds = Array.from(new Set([...(currentRoom?.approved_ids || []), targetUserId]));
        
        await supabase.from('rooms').update({ approved_ids: updatedIds }).eq('id', roomId);
        
        io.to(targetSocketId).emit('room:approved', { 
          roomId, 
          code: room.metadata.join_code,
          room: room.metadata // 🌟 Send metadata so it appears in sidebar
        });
        io.to(targetSocketId).emit('room:history', { messages: room.messages, metadata: room.metadata });
        io.to(roomId).emit('room:members', await getRoomMembers(roomId));
      }
    });

    socket.on('room:reject', async ({ roomId, targetSocketId }) => {
      const room = activeRooms.get(roomId);
      if (!room || room.metadata.created_by !== userId) return;
      
      room.pending.delete(targetSocketId);
      io.to(targetSocketId).emit('room:rejected', { roomId });
      io.to(roomId).emit('room:members', await getRoomMembers(roomId));
    });

    socket.on('message:send', async ({ roomId, content, image }) => {
      let room = activeRooms.get(roomId);
      
      // Hyper-Healing: Re-initialize global rooms instantly
      if (!room && ['general', 'tech-talk', 'ai-lounge'].includes(roomId)) {
        room = { 
          users: new Map(), 
          messages: [], 
          metadata: { id: roomId, name: roomId, is_private: false },
          pending: new Map(),
          approvedUserIds: new Set()
        };
        activeRooms.set(roomId, room);
      }

      // Sync Check: Ensure user is in the room
      if (room && !room.users.has(socket.id) && !['general', 'tech-talk', 'ai-lounge'].includes(roomId)) {
        return;
      }

      if (!room || !room.users.has(socket.id)) return;

      const message = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        roomId, // 🌟 Tag with roomId for isolation
        userId, 
        username: profile.username, 
        avatar: profile.avatar,
        content, 
        timestamp: new Date().toISOString()
      };

      room.messages.push(message);
      
      if (room.messages.length > 100) room.messages.shift();
      io.to(roomId).emit('message:new', message);
    });

    socket.on('room:create', async ({ name, isPrivate, code }) => {
      console.log(`[Socket] Room create requested: ${name} (private: ${isPrivate})`);
      try {
        const codeHash = isPrivate && code ? await bcrypt.hash(code, 10) : null;
        
        let { data: dbRoom, error } = await userSupabase
          .from('rooms')
          .insert({
            name,
            is_private: isPrivate,
            code_hash: codeHash,
            join_code: code,
            created_by: userId
          })
          .select()
          .single();

        if (error && error.message.includes('join_code')) {
          const result = await userSupabase.from('rooms').insert({
            name, is_private: isPrivate, code_hash: codeHash, created_by: userId
          }).select().single();
          dbRoom = result.data;
          error = result.error;
        }

        if (error) throw error;
        
        // 🛡️ STEALTH SYNC: Only show to the creator. Others see it only after approval.
        socket.emit('room:force_add', { room: dbRoom });
        socket.emit('room:created', dbRoom);
      } catch (err) {
        console.error('[Socket] Create Error:', err.message);
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('room:kick', async ({ roomId, targetUserId }) => {
      const room = activeRooms.get(roomId);
      if (!room || room.metadata.created_by !== userId) return;
      
      // Revoke lifetime approval
      room.approvedUserIds.delete(targetUserId);

      room.users.forEach((uId, sId) => {
        if (uId === targetUserId) {
          io.sockets.sockets.get(sId)?.leave(roomId);
          io.to(sId).emit('room:kicked', { roomId });
          room.users.delete(sId);
        }
      });
      io.to(roomId).emit('room:members', await getRoomMembers(roomId));
    });

    socket.on('room:delete', async ({ roomId }) => {
      const room = activeRooms.get(roomId);
      if (!room || room.metadata.created_by !== userId) return;
      const { error } = await userSupabase.from('rooms').delete().eq('id', roomId);
      if (error) return socket.emit('error', { message: 'Failed to delete room' });
      
      // ⚡ EXPLICIT SYNC: Tell all sidebars to delete this specific room ID
      io.emit('room:force_remove', { roomId });
      io.to(roomId).emit('room:deleted', { roomId });
      activeRooms.delete(roomId);
    });

    socket.on('disconnect', async () => {
      console.log(`[Socket] 🔴 Disconnected: ${socket.id} (User: ${userId})`);
      socketToUser.delete(socket.id);
      
      // Update member lists for all rooms this user was in
      for (const [roomId, room] of activeRooms.entries()) {
        if (room.users.has(socket.id)) {
          room.users.delete(socket.id);
          const members = await getRoomMembers(roomId);
          io.to(roomId).emit('room:members', members);
        }
      }

      // 🛡️ GLOBAL EVAPORATION: Only clear if the ENTIRE server is empty
      if (socketToUser.size === 0) {
        console.log('[Socket] ⚠️ Server is empty. Global Evaporation initiated (60s)...');
        const globalTimer = setTimeout(() => {
          if (socketToUser.size === 0) {
            activeRooms.forEach((room, roomId) => {
              const isGlobal = ['general', 'tech-talk', 'ai-lounge'].includes(String(roomId).toLowerCase());
              if (!isGlobal) activeRooms.delete(roomId);
            });
            console.log('[Socket] 💨 Global Evaporation complete. All non-global rooms cleared.');
          }
        }, 60000); // 60 seconds of grace period
        global._evaporationTimer = globalTimer;
      }
    });

    // Cancel evaporation if anyone joins
    if (global._evaporationTimer && socketToUser.size > 0) {
      clearTimeout(global._evaporationTimer);
      global._evaporationTimer = null;
      console.log('[Socket] ✨ Global Evaporation cancelled. Users detected.');
    }
  });


  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${PORT}`);
  });
});

