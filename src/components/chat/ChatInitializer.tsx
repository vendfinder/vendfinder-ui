'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChatStore, useChatStoreWithAuth } from '@/stores/chat';
import { useSocket } from '@/hooks/useSocket';

export default function ChatInitializer() {
  const { isAuthenticated, token } = useAuth();
  const { reset, conversationsLoaded } = useChatStore();
  const { fetchConversations } = useChatStoreWithAuth();

  // Initialize socket connection
  useSocket(isAuthenticated ? token : null);

  // Fetch conversations when authenticated
  useEffect(() => {
    if (isAuthenticated && token && !conversationsLoaded) {
      fetchConversations();
    }
  }, [isAuthenticated, token, conversationsLoaded, fetchConversations]);

  // Reset on logout
  useEffect(() => {
    if (!isAuthenticated) {
      reset();
    }
  }, [isAuthenticated, reset]);

  return null;
}
