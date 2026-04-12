'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import type { TypingIndicator } from '@/types';

interface TypingIndicatorProps {
  users: TypingIndicator[];
}

export default function TypingIndicatorComponent({
  users,
}: TypingIndicatorProps) {
  const t = useTranslations('chat');

  if (users.length === 0) return null;

  const names = users.map((u) => u.username);
  const text =
    names.length === 1
      ? t('isTyping', { name: names[0] })
      : names.length === 2
        ? t('areTyping', { name1: names[0], name2: names[1] })
        : t('andOthers', { name: names[0], count: names.length - 1 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex items-center gap-2 py-1"
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted/50"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
      <span className="text-[11px] text-muted/60">{text}</span>
    </motion.div>
  );
}
