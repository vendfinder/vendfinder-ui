'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ChevronRight, Layers } from 'lucide-react';
import type { Product, Category } from '@/types';
import ProductGrid from '@/components/product/ProductGrid';

export default function CategoryPageClient({
  category,
  products,
}: {
  category: Category;
  products: Product[];
}) {
  const t = useTranslations('product');
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <motion.nav
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-1.5 text-[12px] text-muted mb-8"
      >
        <Link href="/" className="hover:text-foreground transition-colors">
          {t('home')}
        </Link>
        <ChevronRight size={12} className="text-muted/40" />
        <Link
          href="/products"
          className="hover:text-foreground transition-colors"
        >
          {t('products')}
        </Link>
        <ChevronRight size={12} className="text-muted/40" />
        <span className="text-foreground font-medium">{category.name}</span>
      </motion.nav>

      {/* Category Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mb-10 relative overflow-hidden bg-card rounded-2xl border border-border p-8"
      >
        {/* Subtle gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.04] via-transparent to-violet-500/[0.03] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent, transparent 24px, white 24px, white 25px)',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Layers size={18} className="text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {category.name}
            </h1>
          </div>
          <p className="text-sm text-muted max-w-md">{category.description}</p>
          <p className="text-[11px] text-muted mt-2">
            {t('productsCount', { count: products.length })}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <ProductGrid products={products} />
      </motion.div>
    </div>
  );
}
