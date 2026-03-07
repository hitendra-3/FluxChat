'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { EmojiPicker } from './ui/EmojiPicker';
import { Send } from 'lucide-react';
import { getSocket } from '@/lib/socket';

export function MessageInput() {
  const [input, setInput] = useState('');
  const { sendMessage, activeRoomId } = useChat();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = () => {
    if (!input.trim() || !activeRoomId) return;

    sendMessage(input);
    setInput('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    if (activeRoomId) {
      const socket = getSocket();
      if (socket.connected) {
        socket.emit('typing:start', { roomId: activeRoomId });

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('typing:stop', { roomId: activeRoomId });
        }, 2000);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    setInput(input + emoji);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 items-center w-full">
      {/* Text Input */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 border border-border bg-background rounded-full pl-4 pr-1 py-1 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none resize-none max-h-32 overflow-y-auto py-2"
          />
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        </div>
      </div>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={!input.trim()}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
      >
        <Send size={18} className="ml-0.5" />
      </button>
    </div>
  );
}
