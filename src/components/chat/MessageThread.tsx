"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ChatMessage } from "@/types";
import ChatBubble from "./ChatBubble";

interface MessageThreadProps {
  messages: ChatMessage[];
  currentUserId: string;
  isBuyer?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onReport?: (messageId: string) => void;
  onAcceptOffer?: (offerId: string) => void;
  onDeclineOffer?: (offerId: string) => void;
  onCounterOffer?: (offerId: string, price: number) => void;
  onPayNow?: (offerId: string, price: number) => void;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (msgDate.getTime() === today.getTime()) return "__today__";
  if (msgDate.getTime() === yesterday.getTime()) return "__yesterday__";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default function MessageThread({
  messages,
  currentUserId,
  isBuyer = false,
  hasMore,
  onLoadMore,
  onReport,
  onAcceptOffer,
  onDeclineOffer,
  onCounterOffer,
  onPayNow,
}: MessageThreadProps) {
  const t = useTranslations("chat");
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasMore || !onLoadMore) return;
    if (scrollRef.current.scrollTop < 100) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore]);

  // Group messages by day
  const grouped: { label: string; messages: ChatMessage[] }[] = [];
  let currentLabel = "";

  for (const msg of messages) {
    const label = formatDateLabel(msg.createdAt);
    if (label !== currentLabel) {
      currentLabel = label;
      grouped.push({ label, messages: [msg] });
    } else {
      grouped[grouped.length - 1].messages.push(msg);
    }
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {hasMore && (
        <div className="text-center py-2">
          <button
            onClick={onLoadMore}
            className="text-[11px] text-primary font-semibold hover:text-primary-dark transition-colors cursor-pointer"
          >
            {t("loadEarlierMessages")}
          </button>
        </div>
      )}

      {grouped.map((group) => (
        <div key={group.label}>
          {/* Date separator */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted/40">
              {group.label === "__today__" ? t("today") : group.label === "__yesterday__" ? t("yesterday") : group.label}
            </span>
            <div className="flex-1 h-px bg-border/30" />
          </div>

          {/* Messages */}
          <div className="space-y-3">
            {group.messages.map((msg, i) => {
              const isSent = msg.senderId === currentUserId;
              const nextMsg = group.messages[i + 1];
              const showTimestamp =
                !nextMsg || nextMsg.senderId !== msg.senderId;

              return (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isSent={isSent}
                  isBuyer={isBuyer}
                  showTimestamp={showTimestamp}
                  onReport={onReport}
                  onAcceptOffer={
                    msg.metadata?.offerId && onAcceptOffer
                      ? () => onAcceptOffer(msg.metadata!.offerId!)
                      : undefined
                  }
                  onDeclineOffer={
                    msg.metadata?.offerId && onDeclineOffer
                      ? () => onDeclineOffer(msg.metadata!.offerId!)
                      : undefined
                  }
                  onCounterOffer={
                    msg.metadata?.offerId && onCounterOffer
                      ? (price) => onCounterOffer(msg.metadata!.offerId!, price)
                      : undefined
                  }
                  onPayNow={onPayNow}
                />
              );
            })}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
