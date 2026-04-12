'use client';

import { useLocale } from 'next-intl';
import { useMemo } from 'react';
import type { Product } from '@/types';

export function useTranslatedProduct(product: Product) {
  const locale = useLocale();

  return useMemo(() => {
    const t = product.translations?.[locale];
    if (!t) return product;

    return {
      ...product,
      name: t.name || product.name,
      description: t.description || product.description,
      longDescription: t.longDescription || product.longDescription,
      features: t.features?.length ? t.features : product.features,
    };
  }, [product, locale]);
}
