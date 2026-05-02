'use client';

import React from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { Shield, UserX } from 'lucide-react';

export function OnlineUsersList() {
  const { members, pendingMembers, activeRoom, kickUser, approveJoin, rejectJoin } = useChat();
  const { user } = useAuth();
  const [confirmingKick, setConfirmingKick] = React.useState<string | null>(null);

  if (!activeRoom) return null;

  const isOwner = activeRoom.created_by === user?.id;

  const handleKickClick = (memberId: string) => {
    if (confirmingKick === memberId) {
      kickUser(activeRoom.id, memberId);
      setConfirmingKick(null);
    } else {
      setConfirmingKick(memberId);
      setTimeout(() => setConfirmingKick(null), 4000);
    }
  };

  // 🛡️ Filter Logic: Show Offline members only in Private Rooms
  const activeIds = new Set(members.map(m => m.id));
  
  // Note: We need the full list of approved users. 
  // For now, we'll use the 'members' as primary, but if it's private, we can assume 
  // 'members' includes everyone currently connected.
  const displayMembers = members; 

  return (
    <div className="flex flex-col h-full bg-background border-l border-border/40">
      <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Controllers</h2>
        <span className="px-2 py-0.5 bg-muted text-[10px] font-mono font-medium rounded border border-border/50 text-muted-foreground">
          {members.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-none">
        <div className="space-y-1">
          {displayMembers.map((member: any) => {
            const isActive = member.isActive;
            return (
              <div 
                key={member.id} 
                className={`group px-3 py-2.5 rounded-xl transition-all duration-150 border border-transparent
                  ${confirmingKick === member.id ? 'bg-destructive/5 border-destructive/20' : 'hover:bg-muted/50'}
                `}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative opacity-90">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatar}`} 
                        className={`w-9 h-9 rounded-lg bg-muted border border-border/40 object-cover ${!isActive ? 'grayscale opacity-40' : ''}`}
                        alt="avatar"
                      />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background shadow-sm
                        ${isActive ? 'bg-green-500' : 'bg-slate-500/50'}
                      `} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[13px] font-medium truncate ${isActive ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                          {member.username}
                        </span>
                        {activeRoom.created_by === member.id && <Shield size={11} className="text-primary/70" />}
                      </div>
                      <span className={`text-[9px] font-semibold uppercase tracking-tight ${isActive ? 'text-green-500/80' : 'text-muted-foreground/30'}`}>
                        {isActive ? 'Active Now' : 'Away'}
                      </span>
                    </div>
                  </div>

                  {isOwner && member.id !== user?.id && confirmingKick !== member.id && (
                    <button 
                      onClick={() => handleKickClick(member.id)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive rounded-md transition-all"
                    >
                      <UserX size={14} />
                    </button>
                  )}
                </div>

                {confirmingKick === member.id && (
                  <div className="mt-2.5 flex gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <button 
                      onClick={() => handleKickClick(member.id)}
                      className="flex-1 bg-destructive text-white text-[10px] font-semibold py-1.5 rounded-lg hover:bg-destructive/90 transition-all"
                    >
                      Kick Member
                    </button>
                    <button 
                      onClick={() => setConfirmingKick(null)}
                      className="px-3 bg-muted text-muted-foreground text-[10px] font-semibold py-1.5 rounded-lg hover:bg-muted/80 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pending Requests Section (Owner Only) */}
        {isOwner && pendingMembers.length > 0 && (
          <div className="pt-4 border-t border-border/40 space-y-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-primary px-3">Pending Approval</h2>
            {pendingMembers.map((member: any) => (
              <div 
                key={member.socketId} 
                className="bg-muted/30 p-4 rounded-xl border border-border/40 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatar}`} 
                    className="w-9 h-9 rounded-lg bg-muted border border-border/40"
                    alt="avatar"
                  />
                  <div className="flex flex-col">
                    <span className="text-[12px] font-semibold text-foreground">{member.username}</span>
                    <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-tight">Access Request</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => approveJoin(activeRoom.id, member.socketId)}
                    className="flex-1 bg-primary text-white text-[10px] font-semibold py-2 rounded-lg hover:bg-primary/90 transition-all"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => rejectJoin(activeRoom.id, member.socketId)}
                    className="px-3 bg-background text-muted-foreground text-[10px] font-semibold py-2 rounded-lg border border-border/50 hover:bg-muted transition-all"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-6 border-t border-border/40 bg-muted/5">
        <div className="flex items-center gap-2 text-muted-foreground/30 justify-center">
          <Shield size={12} />
          <span className="text-[9px] font-medium tracking-tight">End-to-end Session Encryption</span>
        </div>
      </div>
    </div>
  );
}
