'use client';

import { useLocale } from 'next-intl';
import { useCallback } from 'react';
import { formatPrice } from '@/lib/utils';
import { type Locale } from '@/i18n/config';

export function useFormattedPrice() {
  const locale = useLocale() as Locale;
  return useCallback((price: number) => formatPrice(price, locale), [locale]);
}
