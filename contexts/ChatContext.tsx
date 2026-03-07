'use client';

import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/hooks/useAuth';

export interface Message {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
  isSystem?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  unreadCount: number;
  lastMessage?: Message;
  createdAt: Date;
  isPublic?: boolean;
  code?: string; // 4-digit join code (same as id on server)
}

export interface ChatUser {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
}

export interface ChatContextType {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  messages: Message[]; // Messages for active room only
  onlineUsers: ChatUser[]; // Members for active room only
  typingUsers: string[];
  setActiveRoom: (roomId: string) => void;
  sendMessage: (content: string) => void;
  createRoom: (name: string, description?: string) => void;
  joinRoomByCode: (code: string) => void;
  setTypingUsers: (userIds: string[]) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, Message[]>>({});
  const [onlineUsersByRoom, setOnlineUsersByRoom] = useState<Record<string, ChatUser[]>>({});
  const [typingUsersByRoom, setTypingUsersByRoom] = useState<Record<string, Set<string>>>({});
  const [socket] = useState(() => getSocket());

  // Connect/disconnect socket based on auth user
  useEffect(() => {
    if (user) {
      if (!socket.connected) {
        socket.connect();
      }

      socket.emit('user:login', {
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
      });
    } else {
      if (socket.connected) {
        socket.disconnect();
      }
      setRooms([]);
      setActiveRoomId(null);
      setMessagesByRoom({});
      setOnlineUsersByRoom({});
      setTypingUsersByRoom({});
    }
  }, [socket, user]);

  // Socket listeners
  useEffect(() => {
    function handleRoomJoined(payload: any) {
      const { room, members } = payload || {};
      if (!room) return;

      const roomId = String(room.id);

      setRooms((prev) => {
        const exists = prev.find((r) => r.id === roomId);
        const baseRoom: ChatRoom = {
          id: roomId,
          name: room.name,
          description: room.description || 'Private room',
          memberCount: Array.isArray(members) ? members.length : room.memberCount || 1,
          unreadCount: 0,
          createdAt: new Date(room.createdAt || Date.now()),
          isPublic: false,
          code: room.code || roomId,
        };
        if (!exists) {
          return [...prev, baseRoom];
        }
        return prev.map((r) =>
          r.id === roomId
            ? {
              ...r,
              memberCount: baseRoom.memberCount,
              description: baseRoom.description,
              code: baseRoom.code,
            }
            : r
        );
      });

      if (Array.isArray(members)) {
        setOnlineUsersByRoom((prev) => ({
          ...prev,
          [roomId]: members.map((m: any) => ({
            id: String(m.id),
            username: m.username,
            avatar: m.avatar || String(m.id),
            status: m.status || 'online',
            lastSeen: new Date(),
          })),
        }));
      }

      setActiveRoomId(roomId);
    }

    function handleRoomMembers(payload: any) {
      const { roomId, members } = payload || {};
      if (!roomId || !Array.isArray(members)) return;

      const id = String(roomId);

      setOnlineUsersByRoom((prev) => ({
        ...prev,
        [id]: members.map((m: any) => ({
          id: String(m.id),
          username: m.username,
          avatar: m.avatar || String(m.id),
          status: m.status || 'online',
          lastSeen: new Date(),
        })),
      }));

      setRooms((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
              ...r,
              memberCount: members.length,
            }
            : r
        )
      );
    }

    function handleMessageNew(payload: any) {
      const { roomId, message } = payload || {};
      if (!roomId || !message) return;

      const id = String(roomId);

      const transformed: Message = {
        id: message.id,
        userId: String(message.userId),
        username: message.username,
        avatar: message.avatar || String(message.userId),
        content: message.content,
        timestamp: new Date(message.timestamp || Date.now()),
        isOwn: user && !message.isSystem ? String(message.userId) === String(user.id) : false,
        isSystem: message.isSystem,
      };

      setMessagesByRoom((prev) => ({
        ...prev,
        [id]: [...(prev[id] || []), transformed],
      }));

      setRooms((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
              ...r,
              lastMessage: transformed,
            }
            : r
        )
      );
    }

    function handleRoomError(payload: any) {
      console.error('Room error:', payload?.message || payload);
    }

    function handleTypingStart(payload: any) {
      const { roomId, userId } = payload || {};
      if (!roomId || !userId || String(userId) === String(user?.id)) return;

      setTypingUsersByRoom((prev) => {
        const roomTyping = prev[roomId] || new Set<string>();
        const newSet = new Set(roomTyping);
        newSet.add(String(userId));
        return { ...prev, [roomId]: newSet };
      });
    }

    function handleTypingStop(payload: any) {
      const { roomId, userId } = payload || {};
      if (!roomId || !userId) return;

      setTypingUsersByRoom((prev) => {
        const roomTyping = prev[roomId] || new Set<string>();
        const newSet = new Set(roomTyping);
        newSet.delete(String(userId));
        return { ...prev, [roomId]: newSet };
      });
    }

    socket.on('room:joined', handleRoomJoined);
    socket.on('room:members', handleRoomMembers);
    socket.on('message:new', handleMessageNew);
    socket.on('room:error', handleRoomError);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('room:joined', handleRoomJoined);
      socket.off('room:members', handleRoomMembers);
      socket.off('message:new', handleMessageNew);
      socket.off('room:error', handleRoomError);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket, user]);

  const setActiveRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    if (socket && socket.connected) {
      socket.emit('user:active_room', { roomId });
    }
  };

  const sendMessage = (content: string) => {
    if (!content.trim() || !activeRoomId || !socket || !user) return;

    socket.emit('message:send', {
      roomId: activeRoomId,
      content: content.trim(),
    });

    // Auto-stop typing on send
    socket.emit('typing:stop', { roomId: activeRoomId });
  };

  const createRoom = (name: string, description?: string) => {
    if (!socket || !user || !name.trim()) return;

    socket.emit('room:create', {
      name: name.trim(),
      description: description?.trim(),
    });
  };

  const joinRoomByCode = (code: string) => {
    const trimmed = code.trim();
    if (!socket || !user || !trimmed) return;

    socket.emit('room:join', {
      code: trimmed,
    });
  };

  const setTypingUsers = (userIds: string[]) => {
    // This function can be kept for backward compatibility or removed if you prefer
    // Since we handle typing internally now via socket events, we can leave this mostly empty.
  };

  const activeRoomMessages = activeRoomId ? messagesByRoom[activeRoomId] || [] : [];
  const activeRoomUsers = activeRoomId ? onlineUsersByRoom[activeRoomId] || [] : [];
  const typingUsers = activeRoomId ? Array.from(typingUsersByRoom[activeRoomId] || []) : [];

  const value: ChatContextType = {
    rooms,
    activeRoomId,
    messages: activeRoomMessages,
    onlineUsers: activeRoomUsers,
    typingUsers,
    setActiveRoom,
    sendMessage,
    createRoom,
    joinRoomByCode,
    setTypingUsers,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

