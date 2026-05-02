'use client';

import React, { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { toast } from 'sonner';
import { Send, Smile } from 'lucide-react';

export function MessageInput() {
  const [input, setInput] = useState('');
  const { sendMessage, activeRoom } = useChat();

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !activeRoom) return;

    sendMessage(activeRoom.id, input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSend} className="relative flex items-center gap-3">
        <div className="flex-1 relative group flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full bg-muted/30 border border-border/40 rounded-xl px-4 md:px-6 py-3 md:py-3.5 text-base md:text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-background transition-all"
            />
            <button 
              type="button"
              className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Smile size={18} />
            </button>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-primary text-white p-3 md:p-3.5 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 disabled:opacity-30 transition-all"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
