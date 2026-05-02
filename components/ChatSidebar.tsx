'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Plus, Hash, Lock, LogOut, Loader2, Globe, Shield } from 'lucide-react';
import { toast } from 'sonner';

const GLOBAL_CHANNELS = [
  { id: 'general', name: 'general', is_private: false },
  { id: 'tech-talk', name: 'tech-talk', is_private: false },
  { id: 'ai-lounge', name: 'ai-lounge', is_private: false },
];

export function ChatSidebar() {
  const { activeRoom, joinRoom, createRoom, socket, rooms, setRooms } = useChat();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [showJoinByCode, setShowJoinByCode] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    fetchRooms();

    const handleRefresh = () => fetchRooms();
    window.addEventListener('refresh_rooms', handleRefresh);

    return () => {
      window.removeEventListener('refresh_rooms', handleRefresh);
    };
  }, []);

  async function fetchRooms() {
    setIsLoading(true);
    const { data } = await supabase.from('rooms').select('*').order('created_at', { ascending: false });
    const savedPins = JSON.parse(localStorage.getItem('fluxchat_pins') || '{}');
    const joinedRoomIds = Object.keys(savedPins);

    const filteredRooms = (data || []).filter(room => {
      // 1. Show if Public
      if (!room.is_private) return true;
      
      // 2. Show if Owner
      if (room.created_by === user?.id) return true;
      
      // 3. 🌟 LIFETIME ACCESS: Show if user's ID is in the approved_ids array from DB
      const approvedIds = room.approved_ids || [];
      if (user?.id && approvedIds.includes(user.id)) return true;
      
      // 4. Fallback: Show if joined locally (legacy support)
      return joinedRoomIds.includes(room.id);
    });

    setRooms(filteredRooms);
    setIsLoading(false);
  }

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    const { data: rooms, error } = await supabase.from('rooms').select('*').eq('join_code', joinCode).limit(1);

    if (error || !rooms || rooms.length === 0) {
      toast.error('Invalid room code');
      return;
    }

    const room = rooms[0];
    // 🛡️ DON'T save to localStorage yet! Just request join.
    joinRoom(room.id, joinCode);
    setJoinCode('');
    setShowJoinByCode(false);
    // Sidebar won't show it yet because it's not in localStorage
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !user) return;
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    createRoom(newRoomName.toLowerCase().replace(/\s+/g, '-'), true, code);
    toast.success(`Room created! Code: ${code}`, { duration: 10000 });
    setShowCreate(false);
    setNewRoomName('');
  };

  const handleJoin = (room: any) => {
    if (room.created_by === user?.id) {
      joinRoom(room.id);
      return;
    }
    const savedPins = JSON.parse(localStorage.getItem('fluxchat_pins') || '{}');
    if (savedPins[room.id]) {
      joinRoom(room.id, savedPins[room.id]);
    } else {
      setShowJoinByCode(true);
      setJoinCode('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-r border-border/40">
      {/* Elite App Header */}
      <div className="px-8 py-6 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Shield size={18} className="text-white" />
          </div>
          <h1 className="text-sm font-black uppercase tracking-[0.25em] text-foreground">FluxChat</h1>
        </div>
        <button onClick={logout} className="p-2 hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive rounded-lg transition-all duration-150">
          <LogOut size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-none">
        {/* User Identity Section */}
        <div className="px-2">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/40 transition-all hover:bg-muted/50">
            <div className="relative">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.avatar || user?.username}`} 
                className="w-10 h-10 rounded-lg bg-background border border-border/50"
                alt="avatar"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-bold tracking-tight text-foreground truncate">{user?.username}</span>
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Active Operator</span>
            </div>
          </div>
        </div>

        {/* Global Navigation */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 px-4">Global Network</h2>
          <div className="space-y-1 px-2">
            {GLOBAL_CHANNELS.map(channel => (
              <button
                key={channel.id}
                onClick={() => joinRoom(channel.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-150 group
                  ${activeRoom?.id === channel.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'hover:bg-muted/50 text-muted-foreground/60 hover:text-foreground'
                }`}
              >
                <Hash size={16} className={activeRoom?.id === channel.id ? 'text-white' : 'text-primary/60'} />
                <span className="text-[13px] font-semibold tracking-tight">{channel.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Private Sector */}
        <div className="space-y-4 px-2">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Private Sector</h2>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => { setShowJoinByCode(!showJoinByCode); setShowCreate(false); }}
                className={`p-1.5 rounded-md transition-all ${showJoinByCode ? 'bg-primary text-white' : 'hover:bg-primary/10 text-muted-foreground/40'}`}
              >
                <Hash size={14} />
              </button>
              <button 
                onClick={() => { setShowCreate(!showCreate); setShowJoinByCode(false); }}
                className={`p-1.5 rounded-md transition-all ${showCreate ? 'bg-primary text-white' : 'hover:bg-primary/10 text-muted-foreground/40'}`}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {(showCreate || showJoinByCode) && (
            <form onSubmit={showCreate ? handleCreate : handleJoinByCode} className="mx-2 p-4 bg-muted/30 rounded-xl border border-border/40 space-y-3 animate-in slide-in-from-top-2 duration-150">
              <input 
                placeholder={showCreate ? "Identify room..." : "Access code..."}
                value={showCreate ? newRoomName : joinCode}
                onChange={e => showCreate ? setNewRoomName(e.target.value) : setJoinCode(e.target.value)}
                maxLength={showJoinByCode ? 4 : 30}
                className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-[12px] font-medium outline-none focus:ring-1 focus:ring-primary/40"
              />
              <button className="w-full bg-primary text-white rounded-lg py-2 text-[11px] font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all uppercase tracking-widest">
                {showCreate ? "Deploy Room" : "Authorize Access"}
              </button>
            </form>
          )}

          <div className="space-y-1">
            {isLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground/40 w-4 h-4" /></div>
            ) : rooms.length === 0 ? (
              <div className="px-4 py-6 border border-dashed border-border/40 rounded-xl text-center">
                <p className="text-[10px] font-medium text-muted-foreground/40 leading-relaxed uppercase tracking-tight">No Active Sector Connections</p>
              </div>
            ) : rooms.map(room => (
              <button
                key={room.id}
                onClick={() => handleJoin(room)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-150 group
                  ${activeRoom?.id === room.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'hover:bg-muted/50 text-muted-foreground/60 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Lock size={15} className={activeRoom?.id === room.id ? 'text-white' : 'text-primary/60'} />
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-[13px] font-semibold tracking-tight truncate w-full text-left">{room.name}</span>
                    {room.created_by === user?.id && (
                      <span className={`text-[8px] font-black uppercase tracking-widest ${activeRoom?.id === room.id ? 'text-white/60' : 'text-primary/60'}`}>Owner</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
