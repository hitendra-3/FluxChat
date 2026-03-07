'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { LogIn, Users } from 'lucide-react';

export function LoginScreen() {
  const [step, setStep] = useState<'username' | 'room'>('username');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('Brian');
  const { login } = useAuth();
  const { createRoom, joinRoomByCode } = useChat();
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      login({
        id: `user-${Date.now()}`,
        username: username.trim(),
        avatar: selectedAvatar,
        status: 'online',
      });
      setStep('room');
    }
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    createRoom(
      roomName.toLowerCase().replace(/\s+/g, '-'),
      roomDesc || 'Private room'
    );
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    joinRoomByCode(joinCode);
    setJoinCode('');
  };

  if (step === 'username') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">FluxChat</h1>
                <p className="text-xs text-muted-foreground">Connect with the world</p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-6">Welcome</h2>

            <form onSubmit={handleUsernameSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-4 text-center">
                  Select an Avatar
                </label>
                <div className="flex justify-center gap-4 mb-4">
                  {['Brian', 'John', 'Sarah', 'Emma'].map(seed => (
                    <button
                      key={seed}
                      type="button"
                      onClick={() => setSelectedAvatar(seed)}
                      className={`relative w-[72px] h-[72px] rounded-full overflow-hidden border-2 transition-all duration-200 ${selectedAvatar === seed
                        ? 'border-primary ring-4 ring-primary/20 scale-110 shadow-lg'
                        : 'border-transparent hover:border-border scale-100 opacity-70 hover:opacity-100'
                        }`}
                    >
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                        alt={seed}
                        className="w-full h-full object-cover bg-muted"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2 text-center mt-2">
                  Your Name
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={32}
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={!username.trim()}
                className="w-full px-4 py-2.5 rounded-md font-medium bg-primary text-primary-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <LogIn size={18} />
                Continue
              </button>
            </form>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Join thousands of people chatting worldwide
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Choose a Room</h2>
          <p className="text-muted-foreground">
            Create a private room and share the 4-digit code, or join an existing one.
          </p>
        </div>

        {/* Create / Join */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Create room */}
          <form
            onSubmit={handleCreateRoom}
            className="bg-card rounded-lg border border-border p-5 space-y-3"
          >
            <h3 className="text-sm font-semibold text-foreground">
              Create a private room
            </h3>
            <p className="text-xs text-muted-foreground">
              We will generate a 4-digit code you can share with friends.
            </p>
            <input
              type="text"
              placeholder="Room name (e.g. friends-chat)"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={30}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={roomDesc}
              onChange={(e) => setRoomDesc(e.target.value)}
              maxLength={60}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!roomName.trim()}
              className="w-full px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
            >
              Create room
            </button>
          </form>

          {/* Join room */}
          <form
            onSubmit={handleJoinRoom}
            className="bg-card rounded-lg border border-border p-5 space-y-3"
          >
            <h3 className="text-sm font-semibold text-foreground">
              Join with room code
            </h3>
            <p className="text-xs text-muted-foreground">
              Enter the 4-digit code shared by the room creator.
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="1234"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="w-full px-3 py-2 rounded-md bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              Join room
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            Signed in as <span className="font-semibold text-foreground">{username}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
