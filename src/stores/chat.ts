'use client';

import { create } from 'zustand';
import type { Conversation, ChatMessage, TypingIndicator } from '@/types';
import * as chatApi from '@/lib/api-chat';

interface ChatStore {
  // State
  conversations: Conversation[];
  activeConversation: string | null;
  messages: Record<string, ChatMessage[]>;
  totalUnread: number;
  typingUsers: Record<string, TypingIndicator[]>;
  onlineUsers: Set<string>;
  isConnected: boolean;
  conversationsLoaded: boolean;
  messagesHasMore: Record<string, boolean>;
  messagesCursors: Record<string, string | null>;

  // Actions
  fetchConversations: (token: string) => Promise<void>;
  loadMessages: (conversationId: string, token: string) => Promise<void>;
  loadMoreMessages: (conversationId: string, token: string) => Promise<void>;
  sendMessage: (
    conversationId: string,
    content: string,
    token: string,
    locale?: string
  ) => Promise<void>;
  sendOffer: (
    conversationId: string,
    price: number,
    token: string
  ) => Promise<void>;
  respondToOffer: (
    offerId: string,
    action: string,
    token: string,
    counterPrice?: number
  ) => Promise<void>;
  startConversation: (
    productId: string,
    sellerId: string,
    token: string,
    productInfo?: { name: string; image: string; price: number }
  ) => Promise<string | null>;
  startSupportConversation: (
    token: string,
    message: string,
    category?: string
  ) => Promise<string | null>;
  markAsRead: (conversationId: string, token: string) => void;
  setActiveConversation: (id: string | null) => void;
  reportMessage: (
    messageId: string,
    reason: string,
    token: string,
    details?: string
  ) => Promise<void>;
  reset: () => void;

  // Socket handlers
  onNewMessage: (msg: ChatMessage) => void;
  onTypingStart: (indicator: TypingIndicator) => void;
  onTypingStop: (conversationId: string, userId: string) => void;
  onPresenceUpdate: (userId: string, status: string) => void;
  onReadUpdate: (conversationId: string, userId: string) => void;
  onMessageTranslated: (
    messageId: string,
    conversationId: string,
    translations: Record<string, string>
  ) => void;
  onOfferUpdate: (offerId: string, status: string) => void;
  onUnreadUpdate: (counts: Record<string, string>, total: number) => void;
  setConnected: (connected: boolean) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: {},
  totalUnread: 0,
  typingUsers: {},
  onlineUsers: new Set(),
  isConnected: false,
  conversationsLoaded: false,
  messagesHasMore: {},
  messagesCursors: {},

  fetchConversations: async (token) => {
    try {
      const conversations = await chatApi.fetchConversations(token);
      const totalUnread = conversations.reduce(
        (sum, c) => sum + c.unreadCount,
        0
      );
      set({ conversations, totalUnread, conversationsLoaded: true });
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  },

  loadMessages: async (conversationId, token) => {
    // Skip if already loaded
    if (get().messages[conversationId]?.length) return;

    try {
      const result = await chatApi.fetchMessages(conversationId, token);
      set((state) => ({
        messages: { ...state.messages, [conversationId]: result.messages },
        messagesHasMore: {
          ...state.messagesHasMore,
          [conversationId]: result.hasMore,
        },
        messagesCursors: {
          ...state.messagesCursors,
          [conversationId]: result.nextCursor,
        },
      }));
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  },

  loadMoreMessages: async (conversationId, token) => {
    const cursor = get().messagesCursors[conversationId];
    if (!cursor || !get().messagesHasMore[conversationId]) return;

    try {
      const result = await chatApi.fetchMessages(conversationId, token, cursor);
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: [
            ...result.messages,
            ...(state.messages[conversationId] || []),
          ],
        },
        messagesHasMore: {
          ...state.messagesHasMore,
          [conversationId]: result.hasMore,
        },
        messagesCursors: {
          ...state.messagesCursors,
          [conversationId]: result.nextCursor,
        },
      }));
    } catch (err) {
      console.error('Failed to load more messages:', err);
    }
  },

  sendMessage: async (conversationId, content, token, locale) => {
    try {
      const msg = await chatApi.sendMessage(
        conversationId,
        content,
        token,
        undefined,
        locale
      );
      // Optimistic update: message will also arrive via socket
      set((state) => {
        const existing = state.messages[conversationId] || [];
        // Avoid duplicate if socket already delivered it
        if (existing.some((m) => m.id === msg.id)) return state;
        return {
          messages: { ...state.messages, [conversationId]: [...existing, msg] },
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  lastMessage: {
                    content,
                    senderId: msg.senderId,
                    timestamp: msg.createdAt,
                  },
                  updatedAt: msg.createdAt,
                }
              : c
          ),
        };
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  },

  sendOffer: async (conversationId, price, token) => {
    try {
      const result = await chatApi.createOffer(conversationId, price, token);
      // Message will arrive via socket
      if (result.message) {
        set((state) => {
          const existing = state.messages[conversationId] || [];
          if (existing.some((m) => m.id === result.message.id)) return state;
          return {
            messages: {
              ...state.messages,
              [conversationId]: [...existing, result.message],
            },
          };
        });
      }
    } catch (err) {
      console.error('Failed to send offer:', err);
    }
  },

  respondToOffer: async (offerId, action, token, counterPrice?) => {
    try {
      await chatApi.respondToOffer(offerId, action, token, counterPrice);
    } catch (err) {
      console.error('Failed to respond to offer:', err);
    }
  },

  startConversation: async (productId, sellerId, token, productInfo?) => {
    try {
      const result = await chatApi.createConversation(
        productId,
        sellerId,
        token,
        productInfo
      );
      if (result.id) {
        // Refresh conversations to get the full object
        await get().fetchConversations(token);
        return result.id;
      }
      return null;
    } catch (err) {
      console.error('Failed to start conversation:', err);
      return null;
    }
  },

  startSupportConversation: async (token, message, category?) => {
    try {
      const result = await chatApi.createSupportConversation(
        token,
        message,
        category
      );
      if (result.id) {
        await get().fetchConversations(token);
        return result.id;
      }
      return null;
    } catch (err) {
      console.error('Failed to start support conversation:', err);
      return null;
    }
  },

  markAsRead: (conversationId, token) => {
    chatApi.markAsRead(conversationId, token).catch(() => {});
    set((state) => {
      const conv = state.conversations.find((c) => c.id === conversationId);
      if (!conv || conv.unreadCount === 0) return state;
      return {
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        ),
        totalUnread: Math.max(0, state.totalUnread - conv.unreadCount),
      };
    });
  },

  setActiveConversation: (id) => set({ activeConversation: id }),

  reportMessage: async (messageId, reason, token, details?) => {
    await chatApi.reportMessage(messageId, reason, token, details);
  },

  reset: () =>
    set({
      conversations: [],
      activeConversation: null,
      messages: {},
      totalUnread: 0,
      typingUsers: {},
      onlineUsers: new Set(),
      isConnected: false,
      conversationsLoaded: false,
      messagesHasMore: {},
      messagesCursors: {},
    }),

  // Socket handlers
  onNewMessage: (msg) => {
    set((state) => {
      const existing = state.messages[msg.conversationId] || [];
      // Avoid duplicates
      if (existing.some((m) => m.id === msg.id)) return state;

      const isActive = state.activeConversation === msg.conversationId;
      const newUnread = isActive ? 0 : 1;

      return {
        messages: {
          ...state.messages,
          [msg.conversationId]: [...existing, msg],
        },
        conversations: state.conversations.map((c) =>
          c.id === msg.conversationId
            ? {
                ...c,
                lastMessage: {
                  content: msg.content,
                  senderId: msg.senderId,
                  timestamp: msg.createdAt,
                },
                updatedAt: msg.createdAt,
                unreadCount: isActive
                  ? c.unreadCount
                  : c.unreadCount + newUnread,
              }
            : c
        ),
        totalUnread: isActive
          ? state.totalUnread
          : state.totalUnread + newUnread,
      };
    });
  },

  onTypingStart: (indicator) => {
    set((state) => {
      const current = state.typingUsers[indicator.conversationId] || [];
      if (current.some((t) => t.userId === indicator.userId)) return state;
      return {
        typingUsers: {
          ...state.typingUsers,
          [indicator.conversationId]: [...current, indicator],
        },
      };
    });
  },

  onTypingStop: (conversationId, userId) => {
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: (state.typingUsers[conversationId] || []).filter(
          (t) => t.userId !== userId
        ),
      },
    }));
  },

  onPresenceUpdate: (userId, status) => {
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      if (status === 'online') {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return { onlineUsers: newSet };
    });
  },

  onReadUpdate: (_conversationId, _userId) => {
    // Could update read receipts state here
  },

  onMessageTranslated: (messageId, conversationId, translations) => {
    set((state) => {
      const msgs = state.messages[conversationId];
      if (!msgs) return state;
      return {
        messages: {
          ...state.messages,
          [conversationId]: msgs.map((m) =>
            m.id === messageId ? { ...m, translations } : m
          ),
        },
      };
    });
  },

  onOfferUpdate: (_offerId, _status) => {
    // Offer status updates arrive as messages too
  },

  onUnreadUpdate: (_counts, total) => {
    set({ totalUnread: total });
  },

  setConnected: (connected) => set({ isConnected: connected }),
}));

// Hook for components that just need totalUnread (lightweight selector)
export const useTotalUnread = () => useChatStore((state) => state.totalUnread);
