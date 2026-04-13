'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, MessageCircle } from 'lucide-react';
import { useAuth, useAuthToken } from '@/context/AuthContext';
import { useLocale } from 'next-intl';
import { useChatStore } from '@/stores/chat';
import { useSocket } from '@/hooks/useSocket';
import ConversationList from '@/components/chat/ConversationList';
import MessageThread from '@/components/chat/MessageThread';
import MessageInput from '@/components/chat/MessageInput';
import ProductContextCard from '@/components/chat/ProductContextCard';
import TypingIndicatorComponent from '@/components/chat/TypingIndicator';
import ReportModal from '@/components/chat/ReportModal';
import ChatCheckout from '@/components/chat/ChatCheckout';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function MessagesPage() {
  const t = useTranslations('dashboardMessages');
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    sendMessage,
    sendOffer,
    respondToOffer,
    markAsRead,
    loadMessages,
    loadMoreMessages,
    reportMessage,
    typingUsers,
    onlineUsers,
    messagesHasMore,
    conversationsLoaded,
  } = useChatStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [reportingMessageId, setReportingMessageId] = useState<string | null>(
    null
  );
  const [checkoutOffer, setCheckoutOffer] = useState<{
    offerId: string;
    price: number;
  } | null>(null);
  const handledParamsRef = useRef<string | null>(null);
  const creatingRef = useRef(false);

  const { token, isAuthenticated, isValidating } = useAuthToken();

  const {
    joinConversation,
    leaveConversation,
    emitTypingStart,
    emitTypingStop,
    emitMessageRead,
  } = useSocket(token);

  // Handle ?conversation=, ?product=, or ?seller= query params
  useEffect(() => {
    if (!token || !conversationsLoaded) return;

    const conversationId = searchParams.get('conversation');
    const productId = searchParams.get('product');
    const sellerId = searchParams.get('seller');

    // Build a key from the URL params so we only process each set once
    const paramsKey = `${conversationId || ''}|${productId || ''}|${sellerId || ''}`;
    if (!conversationId && !productId && !sellerId) return;
    if (handledParamsRef.current === paramsKey) return;

    // Helper: activate a conversation by ID
    const activate = (id: string) => {
      loadMessages(id);
      markAsRead(id);
      setActiveConversation(id);
      setMobileShowThread(true);
    };

    // Direct conversation open (from support bot or links)
    if (conversationId) {
      const existing = conversations.find((c) => c.id === conversationId);
      if (existing) {
        handledParamsRef.current = paramsKey;
        activate(existing.id);
        router.replace('/dashboard/messages', { scroll: false });
      }
      return;
    }

    // Product-based conversation
    if (productId) {
      const existing = conversations.find((c) => c.product?.id === productId);
      if (existing) {
        handledParamsRef.current = paramsKey;
        activate(existing.id);
        router.replace('/dashboard/messages', { scroll: false });
        return;
      }
      if (sellerId && !creatingRef.current) {
        creatingRef.current = true;
        handledParamsRef.current = paramsKey;
        useChatStore
          .getState()
          .startConversation(productId, sellerId)
          .then((convId) => {
            creatingRef.current = false;
            if (convId) {
              activate(convId);
              router.replace('/dashboard/messages', { scroll: false });
            }
          })
          .catch((error) => {
            creatingRef.current = false;
            console.error('Failed to create conversation:', error);
          });
      }
      return;
    }

    // Direct message to a user (from profile page or order)
    if (sellerId) {
      const existing = conversations.find(
        (c) =>
          c.type === 'direct' && c.participants?.some((p) => p.id === sellerId)
      );
      if (existing) {
        handledParamsRef.current = paramsKey;
        activate(existing.id);
        router.replace('/dashboard/messages', { scroll: false });
        return;
      }
      if (!creatingRef.current) {
        creatingRef.current = true;
        handledParamsRef.current = paramsKey;
        useChatStore
          .getState()
          .startConversation('', sellerId)
          .then((convId) => {
            creatingRef.current = false;
            if (convId) {
              activate(convId);
              router.replace('/dashboard/messages', { scroll: false });
            }
          })
          .catch((error) => {
            creatingRef.current = false;
            console.error('Failed to create conversation:', error);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, conversationsLoaded, conversations.length]);

  // Join/leave socket room when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      joinConversation(activeConversation);
    }
    return () => {
      if (activeConversation) {
        leaveConversation(activeConversation);
      }
    };
  }, [activeConversation, joinConversation, leaveConversation]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      if (token) {
        loadMessages(id);
        markAsRead(id);
        emitMessageRead(id);
      }
      setActiveConversation(id);
      setMobileShowThread(true);
    },
    [setActiveConversation, loadMessages, markAsRead, emitMessageRead, token]
  );

  const locale = useLocale();
  const handleSend = useCallback(
    (content: string) => {
      if (!activeConversation || !token) return;
      sendMessage(activeConversation, content, locale);
    },
    [activeConversation, sendMessage, token, locale]
  );

  const handleSendOffer = useCallback(
    (price: number) => {
      if (!activeConversation || !token) return;
      sendOffer(activeConversation, price);
    },
    [activeConversation, sendOffer, token]
  );

  const handleAcceptOffer = useCallback(
    (offerId: string) => {
      if (!token) return;
      respondToOffer(offerId, 'accept');
    },
    [respondToOffer, token]
  );

  const handleDeclineOffer = useCallback(
    (offerId: string) => {
      if (!token) return;
      respondToOffer(offerId, 'decline');
    },
    [respondToOffer, token]
  );

  const handleCounterOffer = useCallback(
    (offerId: string, price: number) => {
      if (!token) return;
      respondToOffer(offerId, 'counter', price);
    },
    [respondToOffer, token]
  );

  const handleLoadMore = useCallback(() => {
    if (!activeConversation || !token) return;
    loadMoreMessages(activeConversation);
  }, [activeConversation, loadMoreMessages, token]);

  const handleReport = useCallback((messageId: string) => {
    setReportingMessageId(messageId);
  }, []);

  const handleReportSubmit = useCallback(
    (reason: string, details?: string) => {
      if (!reportingMessageId || !token) return;
      reportMessage(reportingMessageId, reason, details);
    },
    [reportingMessageId, reportMessage, token]
  );

  const handlePayNow = useCallback((offerId: string, price: number) => {
    setCheckoutOffer({ offerId, price });
  }, []);

  const handleBack = useCallback(() => {
    setMobileShowThread(false);
    setActiveConversation(null);
  }, [setActiveConversation]);

  const activeConv = conversations.find((c) => c.id === activeConversation);
  // Buyer is participant1 (the one who initiated the conversation about a product)
  const isBuyer = !!(
    activeConv?.product && activeConv.participants?.[0]?.id === user?.id
  );
  const sellerParticipant = activeConv?.participants?.find(
    (p) => p.id !== user?.id
  );
  const activeMessages = activeConversation
    ? messages[activeConversation] || []
    : [];
  const hasMore = activeConversation
    ? messagesHasMore[activeConversation] || false
    : false;
  const otherParticipant = activeConv?.participants?.find(
    (p) => p.id !== user?.id
  );
  const isOtherOnline = otherParticipant
    ? onlineUsers.has(otherParticipant.id)
    : false;

  const activeTyping = activeConversation
    ? (typingUsers[activeConversation] || []).filter(
        (t) => t.userId !== user?.id
      )
    : [];

  const userId = user?.id || '';

  if (
    conversationsLoaded &&
    conversations.length === 0 &&
    !searchParams.get('seller') &&
    !searchParams.get('product')
  ) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
          <Mail size={28} className="text-primary/60" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-1">
          {t('noMessagesYet')}
        </h2>
        <p className="text-[13px] text-muted max-w-sm mb-6">
          {t('noMessagesDesc')}
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors"
        >
          <MessageCircle size={15} />
          {t('browseProducts')}
        </Link>
      </motion.div>
    );
  }

  // Shared thread props for both desktop and mobile
  const threadProps = {
    messages: activeMessages,
    currentUserId: userId,
    isBuyer,
    hasMore,
    onLoadMore: handleLoadMore,
    onReport: handleReport,
    onAcceptOffer: handleAcceptOffer,
    onDeclineOffer: handleDeclineOffer,
    onCounterOffer: handleCounterOffer,
    onPayNow: handlePayNow,
  };

  const inputProps = {
    onSend: handleSend,
    hasProduct: !!activeConv?.product,
    onSendOffer: activeConv?.product ? handleSendOffer : undefined,
    onTypingStart: () =>
      activeConversation && emitTypingStart(activeConversation),
    onTypingStop: () =>
      activeConversation && emitTypingStop(activeConversation),
  };

  // Show loading state while validating authentication
  if (isValidating) {
    return (
      <div className="flex items-center justify-center py-24 text-center">
        <p className="text-sm text-muted">{t('validatingAuth')}</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !token) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-muted mb-4">{t('pleaseLogin')}</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors"
        >
          {t('goToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-[13px] text-muted mt-0.5">
          {t('conversationCount', { count: conversations.length })}
        </p>
      </div>

      {/* Split panel container */}
      <div
        className="bg-card rounded-2xl border border-border overflow-hidden"
        style={{ height: 'calc(100vh - 260px)', minHeight: 480 }}
      >
        {/* Desktop: side-by-side */}
        <div className="hidden md:flex h-full">
          {/* Left: Conversation list */}
          <div className="w-80 border-r border-border/50 flex-shrink-0 h-full">
            <ConversationList
              conversations={conversations}
              activeId={activeConversation}
              currentUserId={userId}
              onSelect={handleSelectConversation}
              onlineUsers={onlineUsers}
            />
          </div>

          {/* Right: Thread */}
          <div className="flex-1 flex flex-col min-w-0 h-full">
            {activeConv ? (
              <>
                {/* Thread header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 shrink-0">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-foreground text-xs font-bold overflow-hidden">
                      {otherParticipant?.avatar ? (
                        <img
                          src={otherParticipant.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        otherParticipant?.name?.charAt(0) || '?'
                      )}
                    </div>
                    {isOtherOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-card" />
                    )}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">
                      {otherParticipant?.name || 'Unknown'}
                    </p>
                    <p className="text-[10px] text-muted">
                      {isOtherOnline ? (
                        <span className="text-emerald-400">{t('online')}</span>
                      ) : (
                        `@${otherParticipant?.username || 'user'}`
                      )}
                    </p>
                  </div>
                </div>

                {/* Product context */}
                {activeConv.product && (
                  <div className="shrink-0">
                    <ProductContextCard product={activeConv.product} />
                  </div>
                )}

                {/* Messages */}
                <MessageThread {...threadProps} />

                {/* Typing indicator */}
                {activeTyping.length > 0 && (
                  <div className="px-4 pb-1">
                    <TypingIndicatorComponent users={activeTyping} />
                  </div>
                )}

                {/* Input or Checkout */}
                <div className="shrink-0">
                  {checkoutOffer && activeConv.product ? (
                    <div className="p-4 border-t border-border/50">
                      <ChatCheckout
                        price={checkoutOffer.price}
                        productId={activeConv.product.id}
                        productName={activeConv.product.name}
                        productImage={activeConv.product.image}
                        sellerId={sellerParticipant?.id || ''}
                        onComplete={() => setCheckoutOffer(null)}
                        onCancel={() => setCheckoutOffer(null)}
                      />
                    </div>
                  ) : (
                    <MessageInput {...inputProps} />
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center mb-3">
                  <MessageCircle size={20} className="text-muted/30" />
                </div>
                <p className="text-sm font-medium text-muted/60">
                  {t('selectConversation')}
                </p>
                <p className="text-[12px] text-muted/40 mt-1">
                  {t('selectConversationDesc')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile: toggle between list and thread */}
        <div className="md:hidden h-full">
          <AnimatePresence mode="wait">
            {!mobileShowThread ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <ConversationList
                  conversations={conversations}
                  activeId={activeConversation}
                  currentUserId={userId}
                  onSelect={handleSelectConversation}
                  onlineUsers={onlineUsers}
                />
              </motion.div>
            ) : (
              <motion.div
                key="thread"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col"
              >
                {activeConv && (
                  <>
                    {/* Mobile thread header with back */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 shrink-0">
                      <button
                        onClick={handleBack}
                        className="p-1.5 -ml-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
                      >
                        <ArrowLeft size={18} className="text-muted" />
                      </button>
                      <div className="relative">
                        <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-foreground text-xs font-bold overflow-hidden">
                          {otherParticipant?.avatar ? (
                            <img
                              src={otherParticipant.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            otherParticipant?.name?.charAt(0) || '?'
                          )}
                        </div>
                        {isOtherOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-card" />
                        )}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-foreground">
                          {otherParticipant?.name || 'Unknown'}
                        </p>
                        <p className="text-[10px] text-muted">
                          {isOtherOnline ? (
                            <span className="text-emerald-400">
                              {t('online')}
                            </span>
                          ) : (
                            `@${otherParticipant?.username || 'user'}`
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Product context */}
                    {activeConv.product && (
                      <div className="shrink-0">
                        <ProductContextCard product={activeConv.product} />
                      </div>
                    )}

                    {/* Messages */}
                    <MessageThread {...threadProps} />

                    {/* Typing indicator */}
                    {activeTyping.length > 0 && (
                      <div className="px-4 pb-1">
                        <TypingIndicatorComponent users={activeTyping} />
                      </div>
                    )}

                    {/* Input or Checkout */}
                    <div className="shrink-0">
                      {checkoutOffer && activeConv.product ? (
                        <div className="p-4 border-t border-border/50">
                          <ChatCheckout
                            price={checkoutOffer.price}
                            productId={activeConv.product.id}
                            productName={activeConv.product.name}
                            productImage={activeConv.product.image}
                            sellerId={sellerParticipant?.id || ''}
                            onComplete={() => setCheckoutOffer(null)}
                            onCancel={() => setCheckoutOffer(null)}
                          />
                        </div>
                      ) : (
                        <MessageInput {...inputProps} />
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={!!reportingMessageId}
        onClose={() => setReportingMessageId(null)}
        onSubmit={handleReportSubmit}
      />
    </motion.div>
  );
}
