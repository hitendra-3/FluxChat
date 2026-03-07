// Simple Socket.IO server for real-time chat rooms with 4-digit codes

const { Server } = require('socket.io');

const PORT = process.env.SOCKET_PORT || 4000;

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {string} avatar
 * @property {'online' | 'away' | 'offline'} status
 * @property {string|null} activeRoom
 */

/**
 * @typedef {Object} Room
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {number} createdAt
 * @property {Set<string>} members // userIds
 * @property {boolean} isDefault
 */

// In-memory stores
/** @type {Map<string, { socketId: string, user: User, rooms: Set<string> }>} */
const usersById = new Map();
/** @type {Map<string, Room>} */
const rooms = new Map();

// Initialize default rooms
const defaultRooms = [
  { id: 'cse', name: 'cse', description: 'CSE Students Lounge', createdAt: Date.now(), members: new Set(), isDefault: true },
  { id: 'tech', name: 'tech', description: 'Tech Talk & News', createdAt: Date.now(), members: new Set(), isDefault: true },
  { id: 'coding', name: 'coding', description: 'Coding & Algorithms', createdAt: Date.now(), members: new Set(), isDefault: true },
  { id: 'ai', name: 'ai', description: 'Artificial Intelligence', createdAt: Date.now(), members: new Set(), isDefault: true },
  { id: 'webdev', name: 'webdev', description: 'Web Development', createdAt: Date.now(), members: new Set(), isDefault: true },
  { id: 'placements', name: 'placements', description: 'Job Placements & Prep', createdAt: Date.now(), members: new Set(), isDefault: true }
];

for (const room of defaultRooms) {
  rooms.set(room.id, room);
}

const io = new Server(PORT, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

console.log(`Socket.IO server running on port ${PORT}`);

function generateRoomCode() {
  // Ensure unique 4-digit numeric code
  let code;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (rooms.has(code));
  return code;
}

function getRoomMembers(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  const result = [];
  for (const userId of room.members) {
    const record = usersById.get(userId);
    if (record) {
      let status = record.user.status;
      if (status === 'online' && record.user.activeRoom !== roomId) {
        status = 'away';
      }
      result.push({ ...record.user, status });
    }
  }
  return result;
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('user:login', (payload) => {
    const { userId, username, avatar } = payload || {};
    if (!userId || !username) return;

    let existingRecord = usersById.get(userId);

    const user = {
      id: userId,
      username,
      avatar: avatar || userId,
      status: 'online',
      activeRoom: null
    };

    usersById.set(userId, {
      socketId: socket.id,
      user,
      rooms: existingRecord ? existingRecord.rooms : new Set(),
    });

    socket.data.userId = userId;

    const record = usersById.get(userId);

    // Auto join default rooms
    for (const dRoom of defaultRooms) {
      const r = rooms.get(dRoom.id);
      r.members.add(userId);
      record.rooms.add(dRoom.id);
    }

    socket.emit('user:login:ack', { user });

    // Join socket to all rooms and emit updates
    for (const roomId of record.rooms) {
      socket.join(roomId);
      const room = rooms.get(roomId);
      if (!room) continue;

      const members = getRoomMembers(roomId);

      socket.emit('room:joined', {
        room: {
          id: room.id,
          name: room.name,
          description: room.description,
          memberCount: members.length,
          unreadCount: 0,
          createdAt: room.createdAt,
          isPublic: false,
          code: room.id,
        },
        members,
        isCreator: false,
      });

      io.to(roomId).emit('room:members', {
        roomId,
        members,
      });
    }
  });

  socket.on('user:active_room', (payload) => {
    const { roomId } = payload || {};
    const userId = socket.data.userId;
    if (!userId) return;

    const record = usersById.get(userId);
    if (!record) return;

    record.user.activeRoom = roomId;

    // Broadcasting updated statuses to all rooms this user is in
    for (const joinedRoomId of record.rooms) {
      const members = getRoomMembers(joinedRoomId);
      io.to(joinedRoomId).emit('room:members', {
        roomId: joinedRoomId,
        members,
      });
    }
  });

  socket.on('room:create', (payload) => {
    const { name, description } = payload || {};
    const userId = socket.data.userId;
    if (!userId || !name) return;

    const userRecord = usersById.get(userId);
    if (!userRecord) return;

    const code = generateRoomCode();
    const room = {
      id: code,
      name,
      description: description || 'Private room',
      createdAt: Date.now(),
      members: new Set([userId]),
      isDefault: false
    };

    rooms.set(code, room);
    userRecord.rooms.add(code);

    socket.join(code);
    userRecord.user.activeRoom = code;

    const members = getRoomMembers(code);

    socket.emit('room:joined', {
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        memberCount: members.length,
        unreadCount: 0,
        createdAt: room.createdAt,
        isPublic: false,
        code: room.id,
      },
      members,
      isCreator: true,
    });

    // Broadcast members
    io.to(code).emit('room:members', {
      roomId: code,
      members,
    });

    // System message
    const joinMessage = {
      id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      roomId: code,
      userId: 'system',
      username: 'System',
      avatar: 'system',
      content: `${userRecord.user.username} created the room.`,
      timestamp: new Date().toISOString(),
      isSystem: true,
    };
    io.to(code).emit('message:new', {
      roomId: code,
      message: joinMessage,
    });
  });

  socket.on('room:join', (payload) => {
    const { code } = payload || {};
    const userId = socket.data.userId;
    if (!userId || !code) return;

    const room = rooms.get(code);
    if (!room) {
      socket.emit('room:error', { message: 'Room not found. Check the 4-digit code.' });
      return;
    }

    const userRecord = usersById.get(userId);
    if (!userRecord) {
      socket.emit('room:error', { message: 'User not registered on server.' });
      return;
    }

    room.members.add(userId);
    userRecord.rooms.add(code);

    socket.join(code);
    userRecord.user.activeRoom = code;

    const members = getRoomMembers(code);

    // Notify joining user
    socket.emit('room:joined', {
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        memberCount: members.length,
        unreadCount: 0,
        createdAt: room.createdAt,
        isPublic: false,
        code: room.id,
      },
      members,
      isCreator: false,
    });

    // Update members list for everyone in the room
    io.to(code).emit('room:members', {
      roomId: room.id,
      members,
    });

    // System message
    const joinMessage = {
      id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      roomId: code,
      userId: 'system',
      username: 'System',
      avatar: 'system',
      content: `${userRecord.user.username} joined the room.`,
      timestamp: new Date().toISOString(),
      isSystem: true,
    };
    io.to(code).emit('message:new', {
      roomId: code,
      message: joinMessage,
    });
  });

  socket.on('message:send', (payload) => {
    const { roomId, content } = payload || {};
    const userId = socket.data.userId;
    if (!userId || !roomId || !content?.trim()) return;

    const userRecord = usersById.get(userId);
    if (!userRecord) return;

    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      roomId,
      userId: userRecord.user.id,
      username: userRecord.user.username,
      avatar: userRecord.user.avatar,
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    io.to(roomId).emit('message:new', {
      roomId,
      message,
    });
  });

  socket.on('typing:start', (payload) => {
    const { roomId } = payload || {};
    const userId = socket.data.userId;
    if (!userId || !roomId) return;

    socket.to(roomId).emit('typing:start', { roomId, userId });
  });

  socket.on('typing:stop', (payload) => {
    const { roomId } = payload || {};
    const userId = socket.data.userId;
    if (!userId || !roomId) return;

    socket.to(roomId).emit('typing:stop', { roomId, userId });
  });

  socket.on('disconnect', () => {
    const userId = socket.data.userId;
    if (!userId) {
      console.log(`Client disconnected (no user): ${socket.id}`);
      return;
    }

    const record = usersById.get(userId);
    if (!record) return;

    // Mark user offline
    record.user.status = 'offline';
    record.user.activeRoom = null;

    // Do NOT delete from usersById or room.members, so they show as offline
    // We just broadcast the offline status

    for (const roomId of record.rooms) {
      const room = rooms.get(roomId);
      if (!room) continue;

      const members = getRoomMembers(roomId);
      io.to(roomId).emit('room:members', {
        roomId,
        members,
      });

      // Emit leave message
      const leaveMessage = {
        id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        roomId,
        userId: 'system',
        username: 'System',
        avatar: 'system',
        content: `${record.user.username} left the room.`,
        timestamp: new Date().toISOString(),
        isSystem: true,
      };

      io.to(roomId).emit('message:new', {
        roomId,
        message: leaveMessage,
      });
    }

    console.log(`Client disconnected: ${socket.id} (user: ${userId})`);

    // Check if everyone is offline to clean up session
    let allOffline = true;
    for (const userRecord of usersById.values()) {
      if (userRecord.user.status !== 'offline') {
        allOffline = false;
        break;
      }
    }

    if (usersById.size > 0 && allOffline) {
      console.log('All users are offline. Closing session and cleaning up memory...');
      usersById.clear();
      rooms.clear();
      // Re-initialize default rooms
      for (const room of defaultRooms) {
        room.members.clear(); // Ensure default room members are cleared out
        rooms.set(room.id, room);
      }
      console.log('Session wiped and defaults restored.');
    }
  });
});

