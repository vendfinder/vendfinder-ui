'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Send, DollarSign, X, Loader2, AlertCircle } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => Promise<void> | void;
  disabled?: boolean;
  hasProduct?: boolean;
  onSendOffer?: (price: number) => Promise<void> | void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export default function MessageInput({
  onSend,
  disabled,
  hasProduct,
  onSendOffer,
  onTypingStart,
  onTypingStop,
}: MessageInputProps) {
  const t = useTranslations('chat');
  const [value, setValue] = useState('');
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [sending, setSending] = useState(false);
  const [sendingOffer, setSendingOffer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string>('');
  const [lastFailedOffer, setLastFailedOffer] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTypingStart?.();
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTypingStop?.();
    }, 2000);
  }, [onTypingStart, onTypingStop]);

  const handleSend = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || sending) return;

    setSending(true);
    setError(null);
    setShowRetry(false);

    try {
      await onSend(trimmed);
      setValue('');
      setLastFailedMessage('');
      // Stop typing indicator
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTypingStop?.();
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setLastFailedMessage(trimmed);
      setError('Failed to send message');
      setShowRetry(true);
    } finally {
      setSending(false);
    }
  }, [value, disabled, sending, onSend, onTypingStop]);

  const handleSendOffer = useCallback(async () => {
    const price = parseFloat(offerPrice);
    if (price <= 0 || !onSendOffer || sendingOffer) return;

    setSendingOffer(true);
    setError(null);
    setShowRetry(false);

    try {
      await onSendOffer(price);
      setOfferPrice('');
      setShowOfferInput(false);
      setLastFailedOffer(null);
    } catch (error) {
      console.error('Failed to send offer:', error);
      setLastFailedOffer(price);
      setError('Failed to send offer');
      setShowRetry(true);
    } finally {
      setSendingOffer(false);
    }
  }, [offerPrice, onSendOffer, sendingOffer]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showOfferInput) {
        handleSendOffer();
      } else {
        handleSend();
      }
    }
  };

  const handleInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    handleTyping();
  };

  const handleRetryMessage = useCallback(async () => {
    if (!lastFailedMessage) return;
    setValue(lastFailedMessage);
    setError(null);
    setShowRetry(false);

    try {
      await onSend(lastFailedMessage);
      setValue('');
      setLastFailedMessage('');
    } catch (error) {
      console.error('Retry failed:', error);
      setError('Failed to send message');
      setShowRetry(true);
    }
  }, [lastFailedMessage, onSend]);

  const handleRetryOffer = useCallback(async () => {
    if (!lastFailedOffer || !onSendOffer) return;
    setOfferPrice(lastFailedOffer.toString());
    setError(null);
    setShowRetry(false);

    try {
      await onSendOffer(lastFailedOffer);
      setOfferPrice('');
      setShowOfferInput(false);
      setLastFailedOffer(null);
    } catch (error) {
      console.error('Retry offer failed:', error);
      setError('Failed to send offer');
      setShowRetry(true);
    }
  }, [lastFailedOffer, onSendOffer]);

  const dismissError = useCallback(() => {
    setError(null);
    setShowRetry(false);
    setLastFailedMessage('');
    setLastFailedOffer(null);
  }, []);

  if (showOfferInput) {
    return (
      <div className="p-4 border-t border-border/50 bg-dark/50 space-y-3">
        {/* Error message for offer */}
        {error && lastFailedOffer && (
          <div className="flex items-center justify-between bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <span className="text-xs text-red-400 font-medium">{error}</span>
            </div>
            <div className="flex items-center gap-1">
              {showRetry && (
                <button
                  onClick={handleRetryOffer}
                  className="text-xs px-2 py-1 bg-red-400/20 text-red-400 rounded-lg hover:bg-red-400/30 transition-colors cursor-pointer font-medium"
                >
                  Retry
                </button>
              )}
              <button
                onClick={dismissError}
                className="p-1 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-surface border border-primary/30 rounded-xl px-4 py-2.5">
            <DollarSign size={16} className="text-primary shrink-0" />
            <input
              type="number"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('enterOfferAmount')}
              autoFocus
              disabled={sendingOffer}
              className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted/50 focus:outline-none disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleSendOffer}
            disabled={!offerPrice || parseFloat(offerPrice) <= 0 || sendingOffer}
            className="shrink-0 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {sendingOffer ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
          <button
            onClick={() => {
              setShowOfferInput(false);
              dismissError();
            }}
            disabled={sendingOffer}
            className="shrink-0 w-10 h-10 rounded-xl bg-surface border border-border text-muted flex items-center justify-center hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-border/50 bg-dark/50 space-y-3">
      {/* Error message for regular messages */}
      {error && lastFailedMessage && (
        <div className="flex items-center justify-between bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <span className="text-xs text-red-400 font-medium">{error}</span>
          </div>
          <div className="flex items-center gap-1">
            {showRetry && (
              <button
                onClick={handleRetryMessage}
                className="text-xs px-2 py-1 bg-red-400/20 text-red-400 rounded-lg hover:bg-red-400/30 transition-colors cursor-pointer font-medium"
              >
                Retry
              </button>
            )}
            <button
              onClick={dismissError}
              className="p-1 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        {hasProduct && onSendOffer && (
          <button
            onClick={() => {
              setShowOfferInput(true);
              dismissError();
            }}
            disabled={sending}
            className="shrink-0 w-10 h-10 rounded-xl bg-surface border border-border/60 text-muted flex items-center justify-center hover:text-primary hover:border-primary/30 transition-colors cursor-pointer disabled:opacity-50"
            title={t('makeOffer')}
          >
            <DollarSign size={16} />
          </button>
        )}
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={t('typeMessage')}
          rows={1}
          disabled={disabled || sending}
          className="flex-1 resize-none bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/40 transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled || sending}
          className="shrink-0 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          {sending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  );
}
