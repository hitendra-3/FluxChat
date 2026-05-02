'use client';

import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  socketId?: string;
}

export interface Message {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  image?: string;
  timestamp: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  is_private: boolean;
  created_by: string;
}

export interface ChatContextType {
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  messages: Message[];
  members: User[];
  pendingMembers: User[];
  sendMessage: (roomId: string, content: string, image?: string) => void;
  joinRoom: (roomId: string, code?: string) => void;
  createRoom: (name: string, isPrivate: boolean, code?: string) => void;
  kickUser: (roomId: string, targetUserId: string) => void;
  deleteRoom: (roomId: string) => void;
  approveJoin: (roomId: string, targetSocketId: string) => void;
  rejectJoin: (roomId: string, targetSocketId: string) => void;
  setRooms: React.Dispatch<React.SetStateAction<any[]>>;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [pendingMembers, setPendingMembers] = useState<User[]>([]);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    if (activeRoom) {
      (window as any)._activeRoomId = activeRoom.id;
    } else {
      (window as any)._activeRoomId = null;
    }
  }, [activeRoom]);

  useEffect(() => {
    if (session?.access_token && !socket) {
      const s = getSocket(session.access_token);
      setSocket(s);
      s.connect();
    }
  }, [session, socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      const lastRoomId = localStorage.getItem('last_room_id');
      if (lastRoomId) {
        const savedPins = JSON.parse(localStorage.getItem('fluxchat_pins') || '{}');
        socket.emit('room:join', { roomId: lastRoomId, code: savedPins[lastRoomId] });
      }
    });

    socket.on('room:history', ({ messages, metadata }: any) => {
      setMessages(messages);
      setActiveRoom(metadata);
    });

    socket.on('message:new', (msg: any) => {
      setMessages((prev) => {
        // 🛡️ STRICT ISOLATION: Only add if message belongs to the current room
        const currentActiveRoom = (window as any)._activeRoomId;
        if (msg.roomId && msg.roomId !== currentActiveRoom) return prev;

        const localIndex = prev.findIndex(m => m.id.startsWith('local-') && m.content === msg.content && m.userId === msg.userId);
        if (localIndex !== -1) {
          const newMessages = [...prev];
          newMessages[localIndex] = msg;
          return newMessages;
        }
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('room:members', (data: { active: User[], pending: User[] }) => {
      setMembers(data.active || []);
      setPendingMembers(data.pending || []);
    });

    socket.on('room:pending', ({ roomId }: any) => {
      console.log('[Socket] 🔒 Room Pending Event Received:', roomId);
      toast.info('Access request submitted. Awaiting administrator approval.', {
        duration: 2000,
        position: 'top-center'
      });
      setMessages([{ 
        id: 'system', 
        content: '🔒 Access request submitted. Awaiting administrator approval.', 
        userId: 'system', 
        username: 'System', 
        avatar: 'system', 
        timestamp: new Date().toISOString() 
      }]);
    });

    socket.on('room:approved', ({ roomId, code, room }: any) => {
      toast.success('Access granted! Welcome to the sector.');
      // 🌟 Save to localStorage
      const savedPins = JSON.parse(localStorage.getItem('fluxchat_pins') || '{}');
      savedPins[roomId] = code;
      localStorage.setItem('fluxchat_pins', JSON.stringify(savedPins));
      
      // ⚡ Direct Inject into sidebar list
      if (room) {
        setRooms(prev => {
          if (prev.find(r => r.id === room.id)) return prev;
          return [room, ...prev];
        });
      }
      window.dispatchEvent(new Event('refresh_rooms'));
    });

    socket.on('room:kicked', ({ roomId }: any) => {
      toast.error('You have been kicked');
      setActiveRoom(null);
      // Force vanish from sidebar memory
      const savedPins = JSON.parse(localStorage.getItem('fluxchat_pins') || '{}');
      delete savedPins[roomId];
      localStorage.setItem('fluxchat_pins', JSON.stringify(savedPins));
      // Refresh sidebar if it's open
      window.dispatchEvent(new Event('refresh_rooms'));
    });

    socket.on('room:rejected', ({ roomId }: any) => {
      toast.error('Access denied by owner.');
      setActiveRoom(null);
      const savedPins = JSON.parse(localStorage.getItem('fluxchat_pins') || '{}');
      delete savedPins[roomId];
      localStorage.setItem('fluxchat_pins', JSON.stringify(savedPins));
      window.dispatchEvent(new Event('refresh_rooms'));
    });

    socket.on('room:deleted', () => {
      setActiveRoom(null);
    });

    socket.on('room:force_add', ({ room }: any) => {
      setRooms(prev => {
        if (prev.find(r => r.id === room.id)) return prev;
        return [room, ...prev];
      });
    });

    socket.on('room:force_remove', ({ roomId }: any) => {
      setRooms(prev => prev.filter(r => r.id !== roomId));
    });

    socket.on('rooms:updated', () => {
      window.dispatchEvent(new Event('refresh_rooms'));
    });

    socket.on('room:created', (newRoom: any) => {
      toast.success(`Room "${newRoom.name}" created!`);
      const code = newRoom.join_code;
      joinRoom(newRoom.id, code);
      // Ensure it's in the list immediately
      setRooms(prev => [newRoom, ...prev.filter(r => r.id !== newRoom.id)]);
    });

    socket.on('error', (err: any) => {
      toast.error(err.message || 'Error');
    });

    return () => {
      socket.off('connect');
      socket.off('message:new');
      socket.off('room:history');
      socket.off('room:members');
      socket.off('room:kicked');
      socket.off('room:deleted');
      socket.off('room:created');
      socket.off('error');
      socket.off('room:pending');
      socket.off('room:approved');
      socket.off('room:rejected');
    };
  }, [socket]);

  const joinRoom = (roomId: string, code?: string) => {
    localStorage.setItem('last_room_id', roomId);
    if (code) {
      const savedPins = JSON.parse(localStorage.getItem('fluxchat_pins') || '{}');
      savedPins[roomId] = code;
      localStorage.setItem('fluxchat_pins', JSON.stringify(savedPins));
    }
    socket?.emit('room:join', { roomId, code });
  };

  const createRoom = (name: string, isPrivate: boolean, code?: string) => {
    socket?.emit('room:create', { name, isPrivate, code });
  };

  const sendMessage = (roomId: string, content: string, image?: string) => {
    if (!socket || !user) return;
    const localMsg: Message = {
      id: `local-${Date.now()}`,
      userId: user.id,
      username: user.user_metadata?.username || user.email?.split('@')[0],
      avatar: user.user_metadata?.avatar_url || '',
      content,
      image,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, localMsg]);
    socket.emit('message:send', { roomId, content, image });
  };

  const kickUser = (roomId: string, targetUserId: string) => {
    socket?.emit('room:kick', { roomId, targetUserId });
  };

  const deleteRoom = (roomId: string) => {
    socket?.emit('room:delete', { roomId });
  };

  const approveJoin = (roomId: string, targetSocketId: string) => {
    socket?.emit('room:approve', { roomId, targetSocketId });
  };

  const rejectJoin = (roomId: string, targetSocketId: string) => {
    socket?.emit('room:reject', { roomId, targetSocketId });
  };

  return (
    <ChatContext.Provider value={{
      rooms,
      activeRoom,
      messages,
      members,
      pendingMembers,
      sendMessage,
      joinRoom,
      createRoom,
      kickUser,
      deleteRoom,
      approveJoin,
      rejectJoin,
      rooms,
      setRooms
    }}>
      {children}
    </ChatContext.Provider>
  );
}
