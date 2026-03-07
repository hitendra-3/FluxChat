'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface RoomSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function RoomSearch({ value, onChange }: RoomSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
      <input
        type="text"
        placeholder="Search rooms..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full pl-9 pr-9 py-2 rounded-lg
          bg-white/10 border border-white/20
          text-foreground placeholder-muted-foreground
          focus:outline-none focus:ring-2 focus:ring-primary
          transition-all duration-200
        `}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
