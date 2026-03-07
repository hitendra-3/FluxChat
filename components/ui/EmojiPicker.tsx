'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Smile, X } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😚', '😙', '😗', '🥲', '😋', '😛',
  '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
  '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷',
  '🤒', '🤕', '🤢', '🤮', '🤮', '🤧', '🤨', '🤏',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🍰', '🧁',
  '👍', '👎', '👏', '🙌', '👋', '✌️', '🤟', '🤘',
  '🔥', '💯', '✨', '⭐', '🌟', '💫', '🎯', '🚀',
];

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground shrink-0"
        title="Add emoji"
      >
        <Smile size={18} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-lg shadow-lg p-3 w-64 z-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Emojis</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-0.5 hover:bg-muted rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiClick(emoji)}
                className="text-lg hover:bg-muted p-1 rounded transition-colors cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
