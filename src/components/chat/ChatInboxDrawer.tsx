"use client";

import { useTranslations } from "next-intl";
import { X, MessageCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useChatStore } from "@/stores/chat";
import { useAuth } from "@/context/AuthContext";

interface ChatInboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function ChatInboxDrawer({ isOpen, onClose }: ChatInboxDrawerProps) {
  const t = useTranslations("chat");
  const { conversations, onlineUsers } = useChatStore();
  const { user } = useAuth();

  if (!isOpen) return null;

  const userId = user?.id;
  const recentConvos = conversations.slice(0, 8);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-surface border-l border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">{t("messages")}</h2>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-foreground cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conversations */}
        {recentConvos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <MessageCircle size={40} className="text-border mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">{t("noMessagesYet")}</p>
            <p className="text-[12px] text-muted mb-4">
              {t("startConversation")}
            </p>
            <Link
              href="/products"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
            >
              {t("browseProducts")}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {recentConvos.map((conv) => {
                const other = conv.participants.find((p) => p.id !== userId);
                const isOnline = other ? onlineUsers.has(other.id) : false;

                return (
                  <Link
                    key={conv.id}
                    href="/dashboard/messages"
                    onClick={onClose}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-card/80 transition-colors border-b border-border/30"
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-foreground text-xs font-bold overflow-hidden">
                        {other?.avatar ? (
                          <img src={other.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          other?.name?.charAt(0) || "?"
                        )}
                      </div>
                      {isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-surface" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-semibold text-foreground truncate">
                          {other?.name || "Unknown"}
                        </p>
                        <span className="text-[10px] text-muted/50 shrink-0">
                          {conv.lastMessage ? timeAgo(conv.lastMessage.timestamp) : ""}
                        </span>
                      </div>
                      {conv.product && (
                        <p className="text-[10px] text-primary/70 font-medium truncate mt-0.5">
                          {conv.product.name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[12px] text-muted/60 truncate flex-1">
                          {conv.lastMessage?.content || "No messages yet"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <Link
                href="/dashboard/messages"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 rounded-xl transition-colors"
              >
                {t("viewAllMessages")}
                <ArrowRight size={14} />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
