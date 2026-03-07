'use client';

import React, { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { MessageInput } from './MessageInput';
import { WelcomeScreen } from './WelcomeScreen';

export function ChatWindow() {
  const { activeRoomId, messages, onlineUsers, rooms } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const room = rooms.find((r) => r.id === activeRoomId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!activeRoomId) {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="hidden md:flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <div className="flex-1">
          <h2 className="font-semibold text-base text-foreground">
            #{room?.name || 'private-room'}
          </h2>
          {room?.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {room.description}
            </p>
          )}
          {room?.code && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Room code: <span className="font-mono font-semibold">{room.code}</span>
            </p>
          )}
        </div>
        {room && (
          <div className="text-right pl-4 flex-shrink-0">
            <p className="text-xs font-medium text-foreground">
              {onlineUsers.length || room.memberCount} members
            </p>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">No messages yet. Be the first to say hello!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <TypingIndicator />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-border p-4 bg-card">
        <MessageInput />
      </div>
    </div>
  );
}
