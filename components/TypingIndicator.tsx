'use client';

import React from 'react';
import { useChat } from '@/hooks/useChat';
import { Avatar } from './ui/Avatar';

export function TypingIndicator() {
  const { typingUsers, onlineUsers } = useChat();

  if (typingUsers.length === 0) return null;

  const firstTypingUser = onlineUsers.find(u => typingUsers.includes(u.id));

  return (
    <div className="flex gap-3 items-end">
      <div className="flex-shrink-0">
        {firstTypingUser ? (
          <Avatar userId={firstTypingUser.id} username={firstTypingUser.username} avatar={firstTypingUser.avatar} size="sm" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted" />
        )}
      </div>
      <div className="flex flex-col gap-1 items-start">
        <p className="text-xs text-muted-foreground ml-1 mb-0.5">
          {typingUsers.length > 1
            ? `${typingUsers.length} people are typing`
            : `${firstTypingUser?.username || 'Someone'} is typing`}
        </p>
        <div className="px-4 py-2.5 rounded-2xl bg-muted/60 text-foreground border border-border inline-flex items-center gap-1.5 h-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}
