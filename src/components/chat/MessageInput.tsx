"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Send, DollarSign, X } from "lucide-react";

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  hasProduct?: boolean;
  onSendOffer?: (price: number) => void;
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
  const t = useTranslations("chat");
  const [value, setValue] = useState("");
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
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

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    // Stop typing indicator
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop?.();
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend, onTypingStop]);

  const handleSendOffer = useCallback(() => {
    const price = parseFloat(offerPrice);
    if (price > 0 && onSendOffer) {
      onSendOffer(price);
      setOfferPrice("");
      setShowOfferInput(false);
    }
  }, [offerPrice, onSendOffer]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
    handleTyping();
  };

  if (showOfferInput) {
    return (
      <div className="flex items-center gap-2 p-4 border-t border-border/50 bg-dark/50">
        <div className="flex-1 flex items-center gap-2 bg-surface border border-primary/30 rounded-xl px-4 py-2.5">
          <DollarSign size={16} className="text-primary shrink-0" />
          <input
            type="number"
            value={offerPrice}
            onChange={(e) => setOfferPrice(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("enterOfferAmount")}
            autoFocus
            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted/50 focus:outline-none"
          />
        </div>
        <button
          onClick={handleSendOffer}
          disabled={!offerPrice || parseFloat(offerPrice) <= 0}
          className="shrink-0 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <Send size={16} />
        </button>
        <button
          onClick={() => setShowOfferInput(false)}
          className="shrink-0 w-10 h-10 rounded-xl bg-surface border border-border text-muted flex items-center justify-center hover:text-foreground transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 p-4 border-t border-border/50 bg-dark/50">
      {hasProduct && onSendOffer && (
        <button
          onClick={() => setShowOfferInput(true)}
          className="shrink-0 w-10 h-10 rounded-xl bg-surface border border-border/60 text-muted flex items-center justify-center hover:text-primary hover:border-primary/30 transition-colors cursor-pointer"
          title={t("makeOffer")}
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
        placeholder={t("typeMessage")}
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/40 transition-colors disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        className="shrink-0 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        <Send size={16} />
      </button>
    </div>
  );
}
