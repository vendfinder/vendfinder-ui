'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  DollarSign,
  Clock,
  Check,
  X,
  ArrowRightLeft,
  CreditCard,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { ChatMessageMetadata } from '@/types';

interface OfferCardProps {
  metadata: ChatMessageMetadata;
  isSent: boolean;
  isBuyer?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onCounter?: (price: number) => void;
  onPayNow?: (offerId: string, price: number) => void;
}

export default function OfferCard({
  metadata,
  isSent,
  isBuyer = false,
  onAccept,
  onDecline,
  onCounter,
  onPayNow,
}: OfferCardProps) {
  const t = useTranslations('chat');
  const [counterPrice, setCounterPrice] = useState('');
  const [showCounter, setShowCounter] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const price = metadata.proposedPrice || 0;
  const status = metadata.status || 'pending';
  const expiresAt = metadata.expiresAt;

  // Countdown timer
  useEffect(() => {
    if (status !== 'pending' || !expiresAt) return;

    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(t('expired'));
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(hours > 0 ? `${hours}h ${mins}m` : `${mins}m`);
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [status, expiresAt]);

  const statusColors: Record<string, string> = {
    pending: 'border-amber-400/30 bg-amber-400/[0.06]',
    accepted: 'border-emerald-400/30 bg-emerald-400/[0.06]',
    declined: 'border-red-400/30 bg-red-400/[0.06]',
    countered: 'border-blue-400/30 bg-blue-400/[0.06]',
    expired: 'border-muted/30 bg-muted/[0.06]',
  };

  const statusLabels: Record<string, { text: string; color: string }> = {
    pending: { text: t('pending'), color: 'text-amber-400' },
    accepted: { text: t('accepted'), color: 'text-emerald-400' },
    declined: { text: t('declined'), color: 'text-red-400' },
    countered: { text: t('countered'), color: 'text-blue-400' },
    expired: { text: t('expired'), color: 'text-muted' },
  };

  const statusInfo = statusLabels[status] || statusLabels.pending;

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 ${statusColors[status] || statusColors.pending}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <DollarSign size={14} className="text-primary" />
          </div>
          <span className="text-[12px] font-semibold text-foreground">
            {isSent ? t('yourOffer') : t('offerReceived')}
          </span>
        </div>
        <span className={`text-[11px] font-bold ${statusInfo.color}`}>
          {statusInfo.text}
        </span>
      </div>

      {/* Price */}
      <div className="text-center py-2">
        <p className="text-2xl font-bold text-foreground tracking-tight">
          {formatPrice(price)}
        </p>
        {status === 'pending' && timeLeft && (
          <div className="flex items-center justify-center gap-1 mt-1.5">
            <Clock size={10} className="text-muted/50" />
            <span className="text-[10px] text-muted/60">
              {t('expiresIn', { time: timeLeft })}
            </span>
          </div>
        )}
      </div>

      {/* Actions (only for received offers that are pending) */}
      {!isSent && status === 'pending' && (
        <div className="space-y-2">
          {showCounter ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
                placeholder={t('counterPrice')}
                className="flex-1 px-3 py-2 text-sm bg-surface border border-border/60 rounded-lg text-foreground placeholder:text-muted/40 focus:outline-none focus:border-primary/40"
              />
              <button
                onClick={() => {
                  const p = parseFloat(counterPrice);
                  if (p > 0 && onCounter) onCounter(p);
                }}
                disabled={!counterPrice || parseFloat(counterPrice) <= 0}
                className="px-3 py-2 text-sm font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-30"
              >
                {t('send')}
              </button>
              <button
                onClick={() => setShowCounter(false)}
                className="px-2 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onAccept}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-bold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <Check size={14} />
                {t('accept')}
              </button>
              <button
                onClick={() => setShowCounter(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-bold bg-surface border border-border text-foreground rounded-lg hover:border-blue-400/40 hover:text-blue-400 transition-colors"
              >
                <ArrowRightLeft size={14} />
                {t('counter')}
              </button>
              <button
                onClick={onDecline}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-bold bg-surface border border-border text-foreground rounded-lg hover:border-red-400/40 hover:text-red-400 transition-colors"
              >
                <X size={14} />
                {t('decline')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pay Now (only for buyer on accepted offers) */}
      {isBuyer && status === 'accepted' && onPayNow && metadata.offerId && (
        <button
          onClick={() => onPayNow(metadata.offerId!, price)}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-bold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-[0_0_15px_rgba(52,211,153,0.15)] hover:shadow-[0_0_25px_rgba(52,211,153,0.25)] transition-all cursor-pointer"
        >
          <CreditCard size={15} />
          {t('pay')} {formatPrice(price)}
        </button>
      )}
    </div>
  );
}
