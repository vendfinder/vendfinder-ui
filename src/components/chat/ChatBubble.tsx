'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Flag, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import OfferCard from './OfferCard';
import ReadReceipt from './ReadReceipt';
import type { ChatMessage } from '@/types';

interface ChatBubbleProps {
  message: ChatMessage;
  isSent: boolean;
  isBot?: boolean;
  isBuyer?: boolean;
  showTimestamp?: boolean;
  onReport?: (messageId: string) => void;
  onAcceptOffer?: () => void;
  onDeclineOffer?: () => void;
  onCounterOffer?: (price: number) => void;
  onPayNow?: (offerId: string, price: number) => void;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function ChatBubble({
  message,
  isSent,
  isBot = false,
  isBuyer = false,
  showTimestamp = true,
  onReport,
  onAcceptOffer,
  onDeclineOffer,
  onCounterOffer,
  onPayNow,
}: ChatBubbleProps) {
  const t = useTranslations('chat');
  const locale = useLocale();
  const [showMenu, setShowMenu] = useState(false);

  // Resolve translated content for received messages (defensive - only if translations is an object)
  const translations =
    message.translations &&
    typeof message.translations === 'object' &&
    !Array.isArray(message.translations)
      ? message.translations
      : null;
  const displayContent =
    !isSent && translations
      ? translations[locale] ||
        translations[locale.split('-')[0]] ||
        message.content
      : message.content;

  // System messages
  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-1">
        <span className="text-[11px] text-muted/50 bg-surface/50 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  // Offer messages
  if (message.type === 'offer' && message.metadata) {
    return (
      <div className={cn('flex', isSent ? 'justify-end' : 'justify-start')}>
        <div className="max-w-[80%] space-y-1">
          <OfferCard
            metadata={message.metadata}
            isSent={isSent}
            isBuyer={isBuyer}
            onAccept={onAcceptOffer}
            onDecline={onDeclineOffer}
            onCounter={onCounterOffer}
            onPayNow={onPayNow}
          />
          {showTimestamp && (
            <div
              className={cn(
                'flex items-center gap-1 px-1',
                isSent ? 'justify-end' : 'justify-start'
              )}
            >
              <p className="text-[10px] text-muted/50">
                {formatTime(message.createdAt)}
              </p>
              {isSent && <ReadReceipt sent read={!!message.readAt} />}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular text/image messages
  return (
    <div
      className={cn('flex group', isSent ? 'justify-end' : 'justify-start')}
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Bot avatar */}
      {isBot && !isSent && (
        <div className="flex-shrink-0 mr-2 mt-1">
          <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary">VB</span>
          </div>
        </div>
      )}
      <div className="max-w-[75%] space-y-1 relative">
        {/* Bot label */}
        {isBot && !isSent && (
          <div className="flex items-center gap-1.5 px-1 mb-0.5">
            <span className="text-[10px] font-semibold text-primary">
              {t('vendBot')}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {t('aiBadge')}
            </span>
          </div>
        )}
        <div
          className={cn(
            'px-4 py-2.5 text-[13px] leading-relaxed',
            isSent
              ? 'bg-primary/15 text-foreground rounded-2xl rounded-br-md'
              : isBot
                ? 'bg-primary/5 border border-primary/20 text-foreground rounded-2xl rounded-bl-md'
                : 'bg-card border border-border/60 text-foreground rounded-2xl rounded-bl-md'
          )}
        >
          {displayContent}
        </div>

        {/* Context menu button (on hover) */}
        {!isSent && onReport && (
          <div className="absolute top-1 -right-8 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-md hover:bg-surface text-muted/40 hover:text-muted transition-colors cursor-pointer"
            >
              <MoreHorizontal size={14} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-10">
                <button
                  onClick={() => {
                    onReport(message.id);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-[12px] text-red-400 hover:bg-red-500/10 w-full cursor-pointer"
                >
                  <Flag size={12} />
                  {t('report')}
                </button>
              </div>
            )}
          </div>
        )}

        {showTimestamp && (
          <div
            className={cn(
              'flex items-center gap-1 px-1',
              isSent ? 'justify-end' : 'justify-start'
            )}
          >
            <p className="text-[10px] text-muted/50">
              {formatTime(message.createdAt)}
            </p>
            {isSent && <ReadReceipt sent read={!!message.readAt} />}
          </div>
        )}
      </div>
    </div>
  );
}
