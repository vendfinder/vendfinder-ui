"use client";

import { useTranslations } from "next-intl";
import { UserPlus, X } from "lucide-react";

interface MessageRequestBannerProps {
  senderName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function MessageRequestBanner({
  senderName,
  onAccept,
  onDecline,
}: MessageRequestBannerProps) {
  const t = useTranslations("chat");

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-primary/[0.06] border-b border-primary/15">
      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
        <UserPlus size={14} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-foreground">
          {t("messageRequest")}
        </p>
        <p className="text-[11px] text-muted">
          {t("wantsToMessage", { name: senderName })}
        </p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={onAccept}
          className="px-3 py-1.5 text-[11px] font-bold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          {t("accept")}
        </button>
        <button
          onClick={onDecline}
          className="p-1.5 text-muted hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
