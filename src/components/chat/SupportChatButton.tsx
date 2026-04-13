'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircleQuestion, X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useChatStoreWithAuth } from '@/stores/chat';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

function useCategories() {
  const t = useTranslations('chat');
  return [
    { id: 'order', label: t('orderIssue') },
    { id: 'return', label: t('returnsRefunds') },
    { id: 'product', label: t('productQuestion') },
    { id: 'account', label: t('accountHelp') },
    { id: 'other', label: t('other') },
  ];
}

export default function SupportChatButton() {
  const t = useTranslations('chat');
  const CATEGORIES = useCategories();
  const { user, token } = useAuth();
  const { fetchConversations, startSupportConversation } = useChatStoreWithAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'category' | 'message'>('category');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Hide on messages page so it doesn't block the chat
  if (pathname?.startsWith('/dashboard/messages')) return null;
  if (!user) return null;

  const handleCategorySelect = (catId: string) => {
    setCategory(catId);
    setStep('message');
  };

  const handleSubmit = async () => {
    if (!message.trim() || !token) return;
    setLoading(true);
    try {
      const conversationId = await startSupportConversation(
        message.trim(),
        category
      );
      if (conversationId) {
        await fetchConversations();
        setIsOpen(false);
        setMessage('');
        setCategory('');
        setStep('category');
        router.push(`/dashboard/messages?conversation=${conversationId}`);
      }
    } catch (err) {
      console.error('Failed to start support conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setMessage('');
    setCategory('');
    setStep('category');
  };

  return (
    <>
      {/* Floating help button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bottom-[calc(var(--tab-bar-height)+1.5rem)]',
          'bg-primary text-white shadow-lg hover:shadow-xl',
          'transition-all duration-200 hover:scale-105 cursor-pointer',
          isOpen && 'hidden'
        )}
      >
        <MessageCircleQuestion size={20} />
        <span className="text-sm font-medium">{t('getHelp')}</span>
      </button>

      {/* Support dialog */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Dialog */}
          <div className="fixed right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden bottom-[calc(var(--tab-bar-height)+1.5rem)]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-primary/10 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                  <MessageCircleQuestion size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {t('vendBotSupport')}
                  </h3>
                  <p className="text-[11px] text-muted">
                    {t('repliesInstantly')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {step === 'category' ? (
                <div className="space-y-3">
                  <p className="text-[13px] text-muted">
                    {t('whatHelpNeeded')}
                  </p>
                  <div className="space-y-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className="w-full text-left px-4 py-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 text-[13px] text-foreground transition-colors cursor-pointer"
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => setStep('category')}
                    className="text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    &larr; {t('changeCategory')}
                  </button>
                  <p className="text-[13px] text-muted">{t('describeIssue')}</p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('typeYourMessage')}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-[13px] text-foreground placeholder:text-muted/50 resize-none focus:outline-none focus:border-primary/40"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!message.trim() || loading}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors cursor-pointer',
                      message.trim() && !loading
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-muted/20 text-muted cursor-not-allowed'
                    )}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        {t('startingConversation')}
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        {t('sendMessage')}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
