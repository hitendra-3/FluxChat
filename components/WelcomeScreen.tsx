'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

export function WelcomeScreen() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 px-4 text-center bg-background">
      <div className="p-4 rounded-lg bg-card border border-border">
        <MessageCircle size={48} className="text-primary mx-auto" />
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-2 text-foreground">Welcome to ChatHub</h2>
        <p className="text-muted-foreground text-base max-w-md">
          Select a room from the left sidebar to start chatting with people around the world
        </p>
      </div>

      <div className="flex gap-2 text-sm text-muted-foreground mt-4 justify-center">
        <div className="h-1 w-1 rounded-full bg-primary mt-2" />
        <p>Connect, chat, and make new friends</p>
      </div>
    </div>
  );
}
