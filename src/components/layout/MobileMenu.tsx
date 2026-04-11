"use client";

import { X, MessageCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navItemHrefs } from "@/data/site";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useTotalUnread } from "@/stores/chat";
import LocaleSwitcher from "@/components/ui/LocaleSwitcher";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const totalUnread = useTotalUnread();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-72 bg-surface border-l border-border shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt={t("common.appName")}
              width={28}
              height={28}
              className="rounded-sm"
            />
            <span className="text-lg font-bold text-foreground">{t("common.appName")}</span>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItemHrefs.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "block px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-card hover:text-foreground"
              )}
            >
              {t(`nav.${item.key}`)}
            </Link>
          ))}
          <Link
            href="/dashboard/messages"
            onClick={onClose}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              pathname === "/dashboard/messages"
                ? "bg-primary/10 text-primary"
                : "text-muted hover:bg-card hover:text-foreground"
            )}
          >
            <MessageCircle size={16} />
            {t("dashboard.messages")}
            {totalUnread > 0 && (
              <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </Link>
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <div className="pb-2">
            <LocaleSwitcher />
          </div>
          <Link
            href="/login"
            onClick={onClose}
            className="block w-full text-center px-4 py-2.5 rounded-lg text-sm font-semibold text-primary border border-primary hover:bg-primary/10 transition-colors"
          >
            {t("nav.logIn")}
          </Link>
          <Link
            href="/signup"
            onClick={onClose}
            className="block w-full text-center px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary-dark transition-colors"
          >
            {t("nav.signUp")}
          </Link>
        </div>
      </div>
    </div>
  );
}
