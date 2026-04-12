'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Rocket,
  CheckCircle2,
  UserCircle,
  Package,
  MessageCircle,
  DollarSign,
  ChevronRight,
  X,
  Circle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';

interface VendorOnboardingProps {
  activeListingsCount: number;
  totalSales: number;
}

interface ChecklistItem {
  key: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle: string;
  done: boolean;
  href?: string;
  hint?: string;
}

export default function VendorOnboarding({
  activeListingsCount,
  totalSales,
}: VendorOnboardingProps) {
  const { user } = useAuth();
  const t = useTranslations('vendorOnboarding');
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [messagesVisited, setMessagesVisited] = useState<boolean>(false);

  // Read persisted state from localStorage on mount
  useEffect(() => {
    if (!user?.id) return;
    const dismissKey = `vendor_onboarding_dismissed_${user.id}`;
    const msgKey = `vendor_onboarding_msgs_${user.id}`;
    setDismissed(localStorage.getItem(dismissKey) === 'true');
    setMessagesVisited(localStorage.getItem(msgKey) === 'true');
  }, [user?.id]);

  // Kill switch: never show if the vendor has any sales, is dismissed, or no user
  if (!user || dismissed || totalSales > 0) return null;

  const profileComplete = !!(user.avatar && user.bio && user.location);
  const firstListing = activeListingsCount > 0;
  const firstMessage = messagesVisited;

  const items: ChecklistItem[] = [
    {
      key: 'profile',
      icon: UserCircle,
      title: t('profileTitle'),
      subtitle: t('profileSubtitle'),
      done: profileComplete,
      href: '/dashboard/profile',
    },
    {
      key: 'listing',
      icon: Package,
      title: t('listingTitle'),
      subtitle: t('listingSubtitle'),
      done: firstListing,
      href: '/dashboard/listings/new',
    },
    {
      key: 'message',
      icon: MessageCircle,
      title: t('messagesTitle'),
      subtitle: t('messagesSubtitle'),
      done: firstMessage,
      href: '/dashboard/messages',
    },
    {
      key: 'sale',
      icon: DollarSign,
      title: t('saleTitle'),
      subtitle: t('saleSubtitle'),
      done: false,
      hint: t('organic'),
    },
  ];

  const checkable = items.slice(0, 3);
  const completedCount = checkable.filter((i) => i.done).length;
  const percent = Math.round((completedCount / 3) * 100);
  const allDone = completedCount === 3;

  const handleDismiss = () => {
    if (!user?.id) return;
    localStorage.setItem(`vendor_onboarding_dismissed_${user.id}`, 'true');
    setDismissed(true);
  };

  const handleMessagesClick = () => {
    if (!user?.id) return;
    localStorage.setItem(`vendor_onboarding_msgs_${user.id}`, 'true');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl overflow-hidden mb-8 border border-primary/20"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-card to-card" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(232,136,58,0.1),transparent_60%)]" />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
              <Rocket size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground mb-0.5">
                {t('welcome', { name: user.name?.split(' ')[0] || 'Seller' })}
              </h3>
              <p className="text-[12px] text-muted">{t('desc')}</p>
            </div>
          </div>
          {allDone && (
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors shrink-0"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              {t('progress', { done: completedCount, total: 3 })}
            </span>
            <span className="text-[11px] font-bold text-primary">
              {percent}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-amber-400"
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const content = (
              <div
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  item.done
                    ? 'border-emerald-400/20 bg-emerald-400/[0.03]'
                    : item.href
                      ? 'border-border bg-surface/50 hover:border-primary/30 hover:bg-surface/80 cursor-pointer'
                      : 'border-border bg-surface/30'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    item.done
                      ? 'bg-emerald-400/15 text-emerald-400'
                      : 'bg-white/[0.04] text-muted'
                  }`}
                >
                  {item.done ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Circle size={16} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-semibold ${
                        item.done
                          ? 'text-foreground/70 line-through'
                          : 'text-foreground'
                      }`}
                    >
                      {item.title}
                    </p>
                    {item.hint && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/10 text-muted font-bold uppercase">
                        {item.hint}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    item.href && !item.done
                      ? 'bg-primary/10 text-primary'
                      : 'text-transparent'
                  }`}
                >
                  <Icon size={14} />
                </div>
                {item.href && !item.done && (
                  <ChevronRight size={14} className="text-muted/50 shrink-0" />
                )}
              </div>
            );

            if (item.href) {
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={
                    item.key === 'message' ? handleMessagesClick : undefined
                  }
                >
                  {content}
                </Link>
              );
            }
            return <div key={item.key}>{content}</div>;
          })}
        </div>

        {allDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex items-center justify-center gap-2 text-[12px] text-emerald-400 font-semibold"
          >
            <CheckCircle2 size={14} />
            {t('allSet')}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
