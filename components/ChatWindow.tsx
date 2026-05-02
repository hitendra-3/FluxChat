'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { WelcomeScreen } from './WelcomeScreen';
import { Trash2, UserX, Shield, Users, Info } from 'lucide-react';
import { toast } from 'sonner';

export function ChatWindow() {
  const { activeRoom, messages, members, deleteRoom, kickUser } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeRoom) {
    return <WelcomeScreen />;
  }

  const isOwner = activeRoom.created_by === user?.id;

  const handleDelete = () => {
    deleteRoom(activeRoom.id);
    setIsDeleting(false);
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Professional Delete Confirmation Modal */}
      {isDeleting && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-background/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-background border border-border shadow-2xl rounded-2xl p-8 animate-in zoom-in duration-150">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-destructive/10 rounded-full text-destructive">
                <Trash2 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold tracking-tight uppercase tracking-widest">Terminate Sector?</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You are about to permanently decommission <span className="text-foreground font-bold">/{activeRoom.name}</span>. All data will be purged.
                </p>
              </div>
              <div className="flex flex-col w-full gap-2 pt-4">
                <button 
                  onClick={handleDelete}
                  className="w-full bg-destructive text-white text-[11px] font-black py-3.5 rounded-xl shadow-lg shadow-destructive/20 hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-widest"
                >
                  Confirm Decommission
                </button>
                <button 
                  onClick={() => setIsDeleting(false)}
                  className="w-full bg-muted text-muted-foreground text-[11px] font-bold py-3.5 rounded-xl hover:bg-muted/80 transition-all uppercase tracking-widest"
                >
                  Abort Mission
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Background Detail */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[140px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      {/* Senior Designer Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6 border-b border-border/40 bg-background/90 backdrop-blur-md z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h2 className="text-lg font-bold tracking-tight text-foreground uppercase tracking-[0.1em]">/{activeRoom.name}</h2>
            {isOwner && <Shield size={13} className="text-primary/70" />}
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground/60 font-mono font-medium uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Users size={12} className="opacity-50"/> {members.length} ONLINE</span>
            <span className="opacity-30">•</span>
            <span className="text-primary/60">ENCRYPTED SESSION</span>
            {activeRoom.is_private && (
              <>
                <span className="opacity-30">•</span>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-primary/20 bg-primary/5 text-[9px] font-bold text-primary tracking-widest">
                   ID: {activeRoom.join_code}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2.5 rounded-xl transition-all duration-150 border ${showInfo ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'hover:bg-muted border-border/40 text-muted-foreground/60 hover:text-foreground'}`}
          >
            <Info size={18} />
          </button>
          {isOwner && (
            <button 
              onClick={() => setIsDeleting(true)}
              className="p-2.5 hover:bg-destructive/10 border border-transparent hover:border-destructive/20 text-muted-foreground/40 hover:text-destructive rounded-xl transition-all duration-150"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Elite Info Overlay */}
      {showInfo && (
        <div className="absolute top-[72px] md:top-[88px] right-4 md:right-8 w-[calc(100vw-2rem)] sm:w-72 bg-background/95 backdrop-blur-2xl border border-border/60 shadow-2xl rounded-2xl p-6 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Room Integrity</h3>
            <span className="px-2 py-0.5 rounded bg-muted text-[9px] font-mono font-bold text-muted-foreground">L2-SEC</span>
          </div>
          
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-3">Active Controllers</p>
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between group p-2 hover:bg-muted/50 rounded-lg transition-all duration-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 ring-4 ring-green-500/10" />
                  <span className="text-[12px] font-semibold tracking-tight">{member.username}</span>
                  {activeRoom.created_by === member.id && <Shield size={10} className="text-primary/50" />}
                </div>
                {isOwner && member.id !== user?.id && (
                  <button 
                    onClick={() => kickUser(activeRoom.id, member.id)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground/30 hover:text-destructive rounded-md transition-all"
                  >
                    <UserX size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-border/20">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/20">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield size={14} className="text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-tight">Persistence Active</span>
                <span className="text-[9px] text-muted-foreground font-medium">Trusted members stored.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-8 space-y-6 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users size={32} />
            </div>
            <p className="text-sm font-medium">No previous messages.</p>
            <p className="text-xs">Start a fresh conversation.</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-4 md:px-8 py-4 md:py-6 bg-background/80 backdrop-blur-md">
        <MessageInput />
      </div>
    </div>
  );
}
