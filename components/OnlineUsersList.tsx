'use client';

import React from 'react';
import { useChat } from '@/hooks/useChat';
import { Avatar } from './ui/Avatar';

export function OnlineUsersList() {
  const { onlineUsers, activeRoomId, rooms } = useChat();
  const activeRoom = rooms.find(r => r.id === activeRoomId);

  // Sort users by status
  const sortedUsers = [...onlineUsers].sort((a, b) => {
    const statusOrder = { online: 0, away: 1, offline: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const onlineCount = sortedUsers.filter(u => u.status === 'online').length;
  const awayCount = sortedUsers.filter(u => u.status === 'away').length;
  const offlineCount = sortedUsers.filter(u => u.status === 'offline').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return '#10b981';
      case 'away':
        return '#f59e0b';
      default:
        return '#9ca3af';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground mb-3">Members</h2>

        {/* Status Summary */}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10b981' }} />
            <span className="text-xs font-medium text-foreground">{onlineCount}</span>
            <span className="text-xs text-muted-foreground hidden lg:inline">Online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
            <span className="text-xs font-medium text-foreground">{awayCount}</span>
            <span className="text-xs text-muted-foreground hidden lg:inline">Away</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#9ca3af' }} />
            <span className="text-xs font-medium text-foreground">{offlineCount}</span>
            <span className="text-xs text-muted-foreground hidden lg:inline">Offline</span>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto">
        {sortedUsers.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No members in this room
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {sortedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
              >
                <div className="relative">
                  <Avatar userId={user.id} username={user.username} avatar={user.avatar} size="sm" />
                  <div
                    className="absolute bottom-[-2px] right-[-2px] w-3 h-3 rounded-full border-2 border-background"
                    style={{ backgroundColor: getStatusColor(user.status) }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.username}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {user.status === 'online'
                      ? `Active now ${activeRoom ? `(#${activeRoom.name})` : ''}`
                      : user.status === 'away'
                        ? 'Away'
                        : 'Offline'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
