'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { EmojiPicker } from './ui/EmojiPicker';
import { Send, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { cn } from '@/lib/utils';

export function MessageInput() {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { sendMessage, activeRoomId } = useChat();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((!input.trim() && !selectedImage) || !activeRoomId) return;

    sendMessage(input, selectedImage || undefined);
    setInput('');
    setSelectedImage(null);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const socket = getSocket();
    if (socket.connected) {
      socket.emit('typing:stop', { roomId: activeRoomId });
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File is too large. Please select an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-2 duration-150 px-3 pb-3">
      {/* Image Preview - Shows above input */}
      {selectedImage && (
        <div className="relative self-start ml-12 mb-2 p-1 bg-white border border-border rounded-xl shadow-lg animate-in zoom-in-95 duration-150">
          <div className="relative h-20 w-20 overflow-hidden rounded-lg">
            <img
              src={selectedImage}
              alt="Preview"
              className="h-full w-full object-cover"
            />
            <button
              onClick={removeSelectedImage}
              className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
            >
              <X size={10} />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 w-full">
        {/* Main Input Container - Fully Rounded */}
        <div className="flex-1 flex items-center bg-background border border-border/60 rounded-[28px] px-2 py-1 shadow-sm focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
          {/* Attachment Button (Inside) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all flex-shrink-0"
            title="Attach photo"
          >
            <Paperclip size={20} className="rotate-45" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* Textarea */}
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={selectedImage ? "Add a caption..." : "Type your message..."}
            rows={1}
            className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none resize-none py-2.5 px-2 min-h-[44px] max-h-32 overflow-y-auto"
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />

          {/* Emoji Picker (Inside Right) */}
          <div className="flex-shrink-0 px-1">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
        </div>

        {/* Send Button - Blue Circle */}
        <button
          onClick={handleSend}
          disabled={!input.trim() && !selectedImage}
          className={cn(
            "flex items-center justify-center w-11 h-11 rounded-full transition-all active:scale-90 shadow-md flex-shrink-0",
            (input.trim() || selectedImage)
              ? "bg-[#007AFF] text-white hover:bg-[#0066D6] shadow-[#007AFF]/20"
              : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
          )}
        >
          <Send size={18} className={cn("transition-transform", (input.trim() || selectedImage) && "translate-x-0.5 -translate-y-0.5")} />
        </button>
      </div>
    </div>
  );
}
