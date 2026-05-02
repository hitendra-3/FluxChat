'use client';

import React, { createContext, useReducer, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

type AuthAction =
  | { type: 'SET_SESSION'; payload: { session: Session | null; user: User | null } }
  | { type: 'SET_LOADING'; payload: boolean };

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_SESSION':
      return {
        ...state,
        session: action.payload.session,
        user: action.payload.user,
        isAuthenticated: !!action.payload.session,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session);
      } else {
        dispatch({ type: 'SET_SESSION', payload: { session: null, user: null } });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session);
      } else {
        dispatch({ type: 'SET_SESSION', payload: { session: null, user: null } });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(session: Session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      dispatch({
        type: 'SET_SESSION',
        payload: {
          session,
          user: {
            id: session.user.id,
            username: profile.username,
            avatar: profile.avatar,
            status: 'online',
          },
        },
      });
    } else {
        // Fallback or wait for profile creation
        dispatch({
            type: 'SET_SESSION',
            payload: {
              session,
              user: {
                id: session.user.id,
                username: session.user.user_metadata.username || 'Anonymous',
                avatar: session.user.user_metadata.avatar || session.user.id,
                status: 'online',
              },
            },
          });
    }
  }

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextType = {
    user: state.user,
    session: state.session,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
