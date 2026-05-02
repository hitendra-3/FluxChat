'use client';

import React, { ReactNode, useState } from 'react';
import { Menu, X } from 'lucide-react';

interface ChatLayoutProps {
  leftSidebar: ReactNode;
  chatWindow: ReactNode;
  rightSidebar: ReactNode;
}

export function ChatLayout({
  leftSidebar,
  chatWindow,
  rightSidebar,
}: ChatLayoutProps) {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      {/* Left Sidebar */}
      <div className="hidden md:flex md:w-64 flex-col border-r border-border bg-sidebar overflow-hidden">
        {leftSidebar}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-card">
          <button
            onClick={() => setLeftOpen(!leftOpen)}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            {leftOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="text-sm font-semibold text-foreground">FluxChat</div>
          <button
            onClick={() => setRightOpen(!rightOpen)}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            {rightOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Chat Window */}
        <div className="flex-1 overflow-hidden">
          {chatWindow}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden md:flex md:w-64 flex-col border-l border-border bg-sidebar overflow-hidden">
        {rightSidebar}
      </div>

      {/* Mobile Left Sidebar Overlay */}
      {leftOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-40"
            onClick={() => setLeftOpen(false)}
          />
          <div className="md:hidden fixed left-0 top-14 h-[calc(100vh-56px)] w-64 bg-sidebar border-r border-border z-50 overflow-y-auto">
            {leftSidebar}
          </div>
        </>
      )}

      {/* Mobile Right Sidebar Overlay */}
      {rightOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-40"
            onClick={() => setRightOpen(false)}
          />
          <div className="md:hidden fixed right-0 top-14 h-[calc(100vh-56px)] w-64 bg-sidebar border-l border-border z-50 overflow-y-auto">
            {rightSidebar}
          </div>
        </>
      )}
    </div>
  );
}
