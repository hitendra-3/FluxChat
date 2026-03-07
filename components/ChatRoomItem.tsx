'use client';

import React from 'react';
import { ChatRoom } from '@/contexts/ChatContext';
import { cn } from '@/lib/utils';

interface ChatRoomItemProps {
  room: ChatRoom;
  isActive: boolean;
  onClick: () => void;
}

export function ChatRoomItem({ room, isActive, onClick }: ChatRoomItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 border-b border-border/40 transition-all duration-150',
        'focus:outline-none focus:bg-muted/50',
        isActive
          ? 'bg-muted/60 text-foreground'
          : 'text-foreground hover:bg-muted/30'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-semibold truncate text-[15px]',
            isActive ? 'text-primary' : 'text-foreground'
          )}>
            #{room.name}
          </h3>
          {room.lastMessage && (
            <p className={cn(
              'text-xs truncate mt-1',
              isActive ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {room.lastMessage.content}
            </p>
          )}
        </div>
        {/* (room.unreadCount > 0 || isActive) test badge if needed */}
        {room.unreadCount > 0 && (
          <div className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-[#007AFF] text-white text-[11px] font-bold flex-shrink-0 mt-1">
            {room.unreadCount}
          </div>
        )}
      </div>
    </button>
  );
}
