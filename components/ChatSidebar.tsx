'use client';

import React, { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { ChatRoomItem } from './ChatRoomItem';
import { Avatar } from './ui/Avatar';
import { Plus, Search, LogOut } from 'lucide-react';

export function ChatSidebar() {
  const { rooms, activeRoomId, setActiveRoom, createRoom, joinRoomByCode } = useChat();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      createRoom(
        newRoomName.toLowerCase().replace(/\s+/g, '-'),
        newRoomDesc || 'A new room'
      );
      setNewRoomName('');
      setNewRoomDesc('');
      setShowCreateModal(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    joinRoomByCode(joinCode);
    setJoinCode('');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-primary">FluxChat</h1>
          {user && (
            <button
              onClick={logout}
              className="p-1.5 hover:bg-muted rounded-md transition-colors"
              title="Logout"
            >
              <LogOut size={18} className="text-muted-foreground" />
            </button>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-2">
            <Avatar userId={user.id} username={user.username} avatar={user.avatar} size="sm" />
            <span className="text-sm font-medium text-foreground truncate">{user.username}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 space-y-2 border-b border-border">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Create Room Button */}
        <button
          onClick={() => setShowCreateModal(!showCreateModal)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-accent transition-colors"
        >
          <Plus size={18} />
          <span className="text-sm">Create Room</span>
        </button>

        {/* Create Room Form */}
        {showCreateModal && (
          <form onSubmit={handleCreateRoom} className="space-y-2 p-3 bg-card rounded-md border border-border">
            <input
              type="text"
              placeholder="Room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              maxLength={30}
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newRoomDesc}
              onChange={(e) => setNewRoomDesc(e.target.value)}
              maxLength={60}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newRoomName.trim()}
                className="flex-1 px-2 py-1.5 text-sm rounded-md bg-primary text-primary-foreground font-medium hover:bg-accent transition-colors disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewRoomName('');
                  setNewRoomDesc('');
                }}
                className="flex-1 px-2 py-1.5 text-sm rounded-md bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Join by 4-digit code */}
        <form onSubmit={handleJoinRoom} className="space-y-2 pt-4 border-t border-border mt-3">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Join private room (4-digit code)
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder="Enter 4-digit code..."
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!joinCode.trim()}
            className="w-full flex items-center justify-center px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            Join Room
          </button>
        </form>
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRooms.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {searchTerm ? 'No rooms found' : 'No rooms available'}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredRooms.map(room => (
              <ChatRoomItem
                key={room.id}
                room={room}
                isActive={activeRoomId === room.id}
                onClick={() => setActiveRoom(room.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
