'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoginScreen } from '@/components/LoginScreen';
import { ChatLayout } from '@/components/ChatLayout';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatWindow } from '@/components/ChatWindow';
import { OnlineUsersList } from '@/components/OnlineUsersList';

export default function Page() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <ChatLayout
      leftSidebar={<ChatSidebar />}
      chatWindow={<ChatWindow />}
      rightSidebar={<OnlineUsersList />}
    />
  );
}
