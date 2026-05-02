'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LogIn, UserPlus, Users, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

export function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('Brian');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'signup' && password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              avatar: selectedAvatar,
            },
          },
        });
        if (error) throw error;
        toast.success('Check your email for confirmation!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Auth Error:', error);
      toast.error(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9fafb] p-6 selection:bg-primary/10">
      <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-2 duration-700">
        
        {/* Executive Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-[0_8px_16px_rgba(var(--primary),0.15)] mb-6">
            <Users size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-[#111827] tracking-tight mb-1">FluxChat Terminal</h1>
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">Secure Communication Protocol</p>
        </div>

        {/* Executive Auth Card */}
        <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02),0_20px_40px_rgba(0,0,0,0.02)] p-10 relative">
          
          <div className="mb-8">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#374151]">
              {mode === 'login' ? 'System Authorization' : 'Profile Initialization'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' && (
              <>
                <div className="space-y-4 mb-8 text-center">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/50">Select Identifier Signal</label>
                  <div className="flex justify-center gap-4">
                    {['Brian', 'John', 'Sarah', 'Emma'].map(seed => (
                      <button
                        key={seed}
                        type="button"
                        onClick={() => setSelectedAvatar(seed)}
                        className={`w-12 h-12 rounded-xl border transition-all duration-200 ${selectedAvatar === seed
                          ? 'border-primary bg-primary/[0.03] shadow-sm scale-105'
                          : 'border-[#f3f4f6] hover:border-[#e5e7eb] grayscale opacity-50 hover:grayscale-0 hover:opacity-100'
                          }`}
                      >
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                          alt={seed}
                          className="w-full h-full object-cover p-1"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#6b7280] ml-0.5">Operator Name</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. ALPHA_ONE"
                    className="w-full px-4 py-3 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] text-[#111827] text-sm focus:border-primary focus:ring-[3px] focus:ring-primary/5 outline-none transition-all placeholder:text-gray-300"
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#6b7280] ml-0.5">Network Identity (Email)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-4 py-3 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] text-[#111827] text-sm focus:border-primary focus:ring-[3px] focus:ring-primary/5 outline-none transition-all placeholder:text-gray-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#6b7280] ml-0.5">Access Credential (Password)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] text-[#111827] text-sm focus:border-primary focus:ring-[3px] focus:ring-primary/5 outline-none transition-all placeholder:text-gray-300"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-lg font-bold text-xs uppercase tracking-[0.1em] bg-[#111827] text-white hover:bg-[#1f2937] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm active:scale-[0.99]"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <LogIn size={16} />
                  Authenticate
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Initialize Profile
                </>
              )}
            </button>
          </form>

          {/* Executive Security Callout */}
          <div className="mt-8 pt-8 border-t border-[#f3f4f6]">
            <div className="flex items-start gap-3 p-4 bg-[#f9fafb] rounded-xl border border-[#f3f4f6]">
              <div className="mt-0.5 text-primary">
                <Shield size={14} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#111827] uppercase tracking-wider">Security Protocol Alert</p>
                <p className="text-[10px] text-[#6b7280] leading-relaxed">
                  "Tattoo your password on your soul. We operate with zero-reset architecture. Your credential is the only key to your encrypted vault."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center flex flex-col gap-4">
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-[11px] text-[#6b7280] hover:text-[#111827] font-semibold transition-colors"
          >
            {mode === 'login' ? "Require new access? Create account" : "Already registered? Sign in to terminal"}
          </button>
          <p className="text-[9px] text-muted-foreground/30 font-bold uppercase tracking-[0.4em]">
            FluxChat v2 // Professional Grade
          </p>
        </div>
      </div>
    </div>
  );
}
