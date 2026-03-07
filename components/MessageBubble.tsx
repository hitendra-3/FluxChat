'use client';

import React from 'react';
import { Message } from '@/contexts/ChatContext';
import { Avatar } from './ui/Avatar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ImageModal } from './ui/ImageModal';
import { useState } from 'react';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (message.isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full inline-block text-center">
          {message.content}
        </span>
      </div>
    );
  }

  const isOwnMessage = message.isOwn;

  return (
    <div
      className={cn(
        'flex gap-3',
        isOwnMessage && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar userId={message.userId} username={message.username} avatar={message.avatar} size="sm" />
      </div>

      {/* Message Content */}
      <div className={cn(
        'flex flex-col gap-1 max-w-xs lg:max-w-md',
        isOwnMessage && 'items-end'
      )}>
        {/* Username and Timestamp */}
        <div className={cn(
          'flex items-center gap-2 text-[11px] text-muted-foreground px-1 mb-0.5',
          isOwnMessage && 'flex-row-reverse'
        )}>
          <span className="font-medium text-xs">{message.username}</span>
          <span>{format(message.timestamp, 'HH:mm')}</span>
        </div>

        {/* Message Bubble */}
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl max-w-full shadow-sm text-[15px]',
            isOwnMessage
              ? 'bg-primary text-primary-foreground rounded-br-[4px]'
              : 'bg-muted/80 text-foreground rounded-bl-[4px]'
          )}
        >
          {message.image && (
            <div className="mb-2 overflow-hidden rounded-lg">
              <img
                src={message.image}
                alt="Shared content"
                className="max-w-full h-auto object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => setIsModalOpen(true)}
              />
            </div>
          )}
          {message.content && (
            <p className="text-sm leading-relaxed break-words">{message.content}</p>
          )}
        </div>
      </div>

      {message.image && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          imageUrl={message.image}
        />
      )}
    </div>
  );
}
