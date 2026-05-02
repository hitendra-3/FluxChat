'use client';

import React from 'react';
import { Message } from '@/contexts/ChatContext';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useAuth();
  const isOwn = message.userId === user?.id;
  const isLocal = message.id.startsWith('local-');

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-150 ${isLocal ? 'opacity-60 grayscale-[0.5]' : ''}`}>
      <div className={`flex gap-3 max-w-[90%] md:max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isOwn && (
          <img 
            src={message.avatar?.startsWith('http') ? message.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.avatar || message.username}`} 
            className="w-9 h-9 rounded-full bg-muted self-end mb-1 border border-border/40"
            alt="avatar"
          />
        )}
        
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {!isOwn && (
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1 mb-1.5">
              {message.username}
            </span>
          )}
          
          <div className={`
            px-5 py-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm border transition-all duration-150
            ${isOwn 
              ? 'bg-primary text-white border-primary/20 rounded-br-none shadow-primary/10' 
              : 'bg-muted/40 text-foreground border-border/40 rounded-bl-none backdrop-blur-md'}
            ${isLocal ? 'border-primary/40 border-dashed' : ''}
          `}>
            {message.content && <p className="font-medium whitespace-pre-wrap">{message.content}</p>}
          </div>
          
          <span className="text-[9px] font-bold text-muted-foreground/40 mt-1.5 px-1 uppercase tracking-widest">
            {format(new Date(message.timestamp), 'HH:mm')}
          </span>
        </div>
      </div>
    </div>
  );
}
