'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '@/stores/chat';
import { playNotificationChime } from '@/lib/notification-sound';
import type { ChatMessage, TypingIndicator } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || '';

export function useSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const store = useChatStore();

  useEffect(() => {
    if (!token) {
      // Disconnect if no token
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        store.setConnected(false);
      }
      return;
    }

    // Don't reconnect if already connected
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      store.setConnected(true);
    });

    socket.on('disconnect', () => {
      store.setConnected(false);
    });

    // Message events
    socket.on('message:new', (msg: ChatMessage) => {
      store.onNewMessage(msg);
      // Play chime for messages from other users
      try {
        const stored = localStorage.getItem('vendfinder-user');
        const currentUserId = stored ? JSON.parse(stored).id : null;
        if (msg.senderId && msg.senderId !== currentUserId) {
          playNotificationChime();
        }
      } catch {
        /* ignore */
      }
    });

    // Typing events
    socket.on('typing:start', (indicator: TypingIndicator) => {
      store.onTypingStart(indicator);
    });

    socket.on(
      'typing:stop',
      ({
        conversationId,
        userId,
      }: {
        conversationId: string;
        userId: string;
      }) => {
        store.onTypingStop(conversationId, userId);
      }
    );

    // Presence events
    socket.on(
      'presence:update',
      ({ userId, status }: { userId: string; status: string }) => {
        store.onPresenceUpdate(userId, status);
      }
    );

    // Read receipts
    socket.on(
      'read:update',
      ({
        conversationId,
        userId,
      }: {
        conversationId: string;
        userId: string;
      }) => {
        store.onReadUpdate(conversationId, userId);
      }
    );

    // Translation updates (arrives after message, updates translations field)
    socket.on(
      'message:translated',
      ({
        messageId,
        conversationId,
        translations,
      }: {
        messageId: string;
        conversationId: string;
        translations: Record<string, string>;
      }) => {
        store.onMessageTranslated(messageId, conversationId, translations);
      }
    );

    // Offer updates
    socket.on(
      'offer:update',
      ({ offerId, status }: { offerId: string; status: string }) => {
        store.onOfferUpdate(offerId, status);
      }
    );

    // Unread counts
    socket.on(
      'unread:update',
      ({
        counts,
        total,
      }: {
        counts: Record<string, string>;
        total: number;
      }) => {
        store.onUnreadUpdate(counts, total);
      }
    );

    // Order notifications
    socket.on(
      'order:shipped',
      (data: {
        orderId: string;
        orderNumber: string;
        productName: string;
        trackingNumber: string;
        carrier: string;
      }) => {
        // Show notification
        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          new Notification('Order Shipped', {
            body: `Your order for ${data.productName} has been shipped! Tracking: ${data.trackingNumber}`,
            icon: '/favicon.ico',
          });
        }

        // Play notification sound
        try {
          playNotificationChime();
        } catch {
          /* ignore */
        }
      }
    );

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      store.setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('conversation:join', conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('conversation:leave', conversationId);
  }, []);

  const emitTypingStart = useCallback((conversationId: string) => {
    socketRef.current?.emit('typing:start', conversationId);
  }, []);

  const emitTypingStop = useCallback((conversationId: string) => {
    socketRef.current?.emit('typing:stop', conversationId);
  }, []);

  const emitMessageRead = useCallback((conversationId: string) => {
    socketRef.current?.emit('message:read', { conversationId });
  }, []);

  return {
    joinConversation,
    leaveConversation,
    emitTypingStart,
    emitTypingStop,
    emitMessageRead,
  };
}
