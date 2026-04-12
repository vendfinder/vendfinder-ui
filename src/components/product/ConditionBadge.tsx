'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export type ConditionValue =
  | 'new'
  | 'used_like_new'
  | 'used_good'
  | 'used_fair';

export interface ConditionConfig {
  value: ConditionValue;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
}

export const CONDITIONS: ConditionConfig[] = [
  {
    value: 'new',
    label: 'New / Deadstock',
    description:
      'Brand new, unworn, with all original packaging and accessories',
    icon: Sparkles,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/20',
    dotColor: 'bg-emerald-400',
  },
  {
    value: 'used_like_new',
    label: 'Used - Excellent',
    description:
      'Worn 1-2 times with minimal signs of wear, complete packaging',
    icon: ShieldCheck,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20',
    dotColor: 'bg-blue-400',
  },
  {
    value: 'used_good',
    label: 'Used - Good',
    description:
      'Light wear visible, fully functional, may not include original packaging',
    icon: CheckCircle2,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    borderColor: 'border-amber-400/20',
    dotColor: 'bg-amber-400',
  },
  {
    value: 'used_fair',
    label: 'Used - Fair',
    description: 'Noticeable wear, fully functional, sold as-is',
    icon: AlertCircle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    borderColor: 'border-orange-400/20',
    dotColor: 'bg-orange-400',
  },
];

export function getConditionConfig(value: ConditionValue): ConditionConfig {
  return CONDITIONS.find((c) => c.value === value) || CONDITIONS[0];
}

const sizeStyles = {
  sm: {
    wrapper: 'px-2 py-0.5 gap-1.5 rounded-lg',
    icon: 10,
    text: 'text-[10px]',
    dot: 'w-1.5 h-1.5',
  },
  md: {
    wrapper: 'px-2.5 py-1 gap-2 rounded-xl',
    icon: 12,
    text: 'text-[11px]',
    dot: 'w-2 h-2',
  },
  lg: {
    wrapper: 'px-3.5 py-1.5 gap-2 rounded-xl',
    icon: 14,
    text: 'text-xs',
    dot: 'w-2 h-2',
  },
};

const CONDITION_LABEL_KEYS: Record<ConditionValue, string> = {
  new: 'conditionNew',
  used_like_new: 'conditionExcellent',
  used_good: 'conditionGood',
  used_fair: 'conditionFair',
};

const CONDITION_DESC_KEYS: Record<ConditionValue, string> = {
  new: 'conditionNewDesc',
  used_like_new: 'conditionExcellentDesc',
  used_good: 'conditionGoodDesc',
  used_fair: 'conditionFairDesc',
};

export default function ConditionBadge({
  condition,
  size = 'md',
  showTooltip = true,
}: {
  condition: ConditionValue;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}) {
  const t = useTranslations('product');
  const config = getConditionConfig(condition);
  const Icon = config.icon;
  const styles = sizeStyles[size];
  const translatedLabel = t(CONDITION_LABEL_KEYS[condition]);
  const translatedDescription = t(CONDITION_DESC_KEYS[condition]);

  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>(
    'top'
  );
  const badgeRef = useRef<HTMLDivElement>(null);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (!showTooltip) return;

    // Determine position based on available space
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      setTooltipPosition(spaceAbove < 80 ? 'bottom' : 'top');
    }

    tooltipTimeout.current = setTimeout(() => {
      setTooltipVisible(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    setTooltipVisible(false);
  };

  return (
    <div
      ref={badgeRef}
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`inline-flex items-center ${styles.wrapper} ${config.bgColor} border ${config.borderColor} font-semibold ${config.color} transition-colors`}
      >
        <Icon size={styles.icon} />
        <span className={`${styles.text} font-bold uppercase tracking-wider`}>
          {translatedLabel}
        </span>
      </div>

      {/* Tooltip */}
      {showTooltip && tooltipVisible && (
        <div
          className={`absolute z-50 w-56 px-3 py-2.5 bg-card border border-border rounded-xl shadow-2xl pointer-events-none ${
            tooltipPosition === 'top'
              ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
              : 'top-full mt-2 left-1/2 -translate-x-1/2'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`${styles.dot} rounded-full ${config.dotColor}`} />
            <span className={`text-[11px] font-bold ${config.color}`}>
              {translatedLabel}
            </span>
          </div>
          <p className="text-[11px] text-muted leading-relaxed">
            {translatedDescription}
          </p>
          {/* Arrow */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-card border-border rotate-45 ${
              tooltipPosition === 'top'
                ? 'bottom-[-5px] border-r border-b'
                : 'top-[-5px] border-l border-t'
            }`}
          />
        </div>
      )}
    </div>
  );
}
