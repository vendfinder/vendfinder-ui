"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, VolumeX } from "lucide-react";
import { Conversation } from "@/types";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  currentUserId: string;
  onSelect: (id: string) => void;
  onlineUsers?: Set<string>;
}

function timeAgoRaw(dateStr: string): { type: "minutes" | "hours" | "days"; value: number } | { type: "now" } | { type: "date"; dateStr: string } {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return { type: "now" };
  if (diff < 3600) return { type: "minutes", value: Math.floor(diff / 60) };
  if (diff < 86400) return { type: "hours", value: Math.floor(diff / 3600) };
  if (diff < 604800) return { type: "days", value: Math.floor(diff / 86400) };
  return { type: "date", dateStr };
}

export default function ConversationList({
  conversations,
  activeId,
  currentUserId,
  onSelect,
  onlineUsers,
}: ConversationListProps) {
  const t = useTranslations("chat");
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const otherName = c.participants?.find((p) => p.id !== currentUserId)?.name || "";
    return (
      otherName.toLowerCase().includes(q) ||
      (c.product?.name || "").toLowerCase().includes(q) ||
      (c.lastMessage?.content || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40"
          />
          <input
            type="text"
            placeholder={t("searchMessages")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-[13px] bg-surface border border-border/50 rounded-xl text-foreground placeholder:text-muted/40 focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
      </div>

      {/* Conversation items */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[12px] text-muted/50">{t("noConversationsFound")}</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const other = conv.participants?.find(
              (p) => p.id !== currentUserId
            );
            const isActive = conv.id === activeId;
            const isOnline = other && onlineUsers?.has(other.id);

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3 text-left transition-all relative cursor-pointer",
                  isActive
                    ? "bg-primary/[0.08] border-l-2 border-primary"
                    : "hover:bg-surface/80 border-l-2 border-transparent",
                  conv.isMuted && "opacity-60"
                )}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-foreground text-xs font-bold overflow-hidden">
                    {other?.avatar ? (
                      <img
                        src={other.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      other?.name?.charAt(0) || "?"
                    )}
                  </div>
                  {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-card" />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p
                        className={cn(
                          "text-[13px] font-semibold truncate",
                          conv.unreadCount > 0
                            ? "text-foreground"
                            : "text-foreground/80"
                        )}
                      >
                        {other?.name || "Unknown"}
                      </p>
                      {conv.isMuted && (
                        <VolumeX size={10} className="text-muted/40 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted/50 shrink-0">
                      {conv.lastMessage
                        ? (() => {
                            const ago = timeAgoRaw(conv.lastMessage.timestamp);
                            if (ago.type === "now") return "now";
                            if (ago.type === "minutes") return t("minutesAgo", { count: ago.value });
                            if (ago.type === "hours") return t("hoursAgo", { count: ago.value });
                            if (ago.type === "days") return t("daysAgo", { count: ago.value });
                            if (ago.type === "date") return new Date(ago.dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
                            return "";
                          })()
                        : ""}
                    </span>
                  </div>
                  {conv.product && (
                    <p className="text-[10px] text-primary/70 font-medium truncate mt-0.5">
                      {conv.product.name}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <p
                      className={cn(
                        "text-[12px] truncate flex-1",
                        conv.unreadCount > 0
                          ? "text-muted font-medium"
                          : "text-muted/60"
                      )}
                    >
                      {conv.lastMessage?.content || "No messages yet"}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
