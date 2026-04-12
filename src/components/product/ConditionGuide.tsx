'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { X, Info } from 'lucide-react';
import { CONDITIONS } from '@/components/product/ConditionBadge';

const CONDITION_LABEL_KEYS: Record<string, string> = {
  new: 'conditionNew',
  used_like_new: 'conditionExcellent',
  used_good: 'conditionGood',
  used_fair: 'conditionFair',
};

const CONDITION_DESC_KEYS: Record<string, string> = {
  new: 'conditionNewDesc',
  used_like_new: 'conditionExcellentDesc',
  used_good: 'conditionGoodDesc',
  used_fair: 'conditionFairDesc',
};

export default function ConditionGuide({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations('product');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Info size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {t('conditionGuide')}
              </h2>
              <p className="text-[11px] text-muted">
                {t('conditionGuideSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Intro */}
        <div className="px-5 pb-4">
          <p className="text-[11px] text-muted leading-relaxed">
            {t('conditionGuideIntro')}
          </p>
        </div>

        {/* Condition Levels */}
        <div className="px-5 pb-5 space-y-3">
          {CONDITIONS.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.value}
                className={`flex items-start gap-3.5 p-4 rounded-xl border ${c.borderColor} ${c.bgColor} transition-colors`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.bgColor} ${c.color}`}
                >
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-bold ${c.color}`}>
                      {t(CONDITION_LABEL_KEYS[c.value])}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    {t(CONDITION_DESC_KEYS[c.value])}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <div className="bg-surface rounded-xl border border-border p-3.5">
            <p className="text-[10px] text-muted/70 leading-relaxed">
              {t('conditionGuideDisclaimer')}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
