'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { locales, type Locale } from '@/i18n/config';
import { setLocale } from '@/i18n/actions';

const localeLabels: Record<Locale, string> = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'es-MX': 'Español (MX)',
  'zh-TW': '中文 (繁體)',
  'ja-JP': '日本語',
  'de-DE': 'Deutsch',
  'fr-FR': 'Français',
  'pt-BR': 'Português (BR)',
  'zh-CN': '中文 (简体)',
};

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    startTransition(async () => {
      await setLocale(newLocale);
      router.refresh();
    });
  };

  return (
    <select
      value={locale}
      onChange={handleChange}
      disabled={isPending}
      className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-muted hover:text-foreground focus:outline-none focus:border-primary/40 transition-colors cursor-pointer disabled:opacity-50"
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {localeLabels[loc]}
        </option>
      ))}
    </select>
  );
}
