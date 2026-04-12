'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Footprints,
  Smartphone,
  Shirt,
  Home,
  Watch,
  Trophy,
  ArrowUpRight,
} from 'lucide-react';
import type { Category, Product } from '@/types';
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion/MotionWrapper';

const iconMap: Record<string, React.ReactNode> = {
  Footprints: <Footprints size={28} />,
  Smartphone: <Smartphone size={28} />,
  Shirt: <Shirt size={28} />,
  Home: <Home size={28} />,
  Watch: <Watch size={28} />,
  Trophy: <Trophy size={28} />,
};

const accentColors = [
  'from-[#FF6B6B]/20 to-transparent',
  'from-[#4ECDC4]/20 to-transparent',
  'from-[#FFE66D]/20 to-transparent',
  'from-[#A78BFA]/20 to-transparent',
  'from-[#F97316]/20 to-transparent',
  'from-primary/20 to-transparent',
];

export default function CategoryShowcase({
  categories,
  categoryProducts,
}: {
  categories: Category[];
  categoryProducts: Record<string, Product[]>;
}) {
  const t = useTranslations('categories');

  return (
    <section className="py-16 lg:py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">
              {t('browseCollections')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground tracking-tight">
              {t('shopByCategory')}
            </h2>
          </div>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {categories.map((category, idx) => {
            const products = categoryProducts[category.slug] || [];
            const topProduct = products[0];

            return (
              <StaggerItem key={category.slug}>
                <Link
                  href={`/categories/${category.slug}`}
                  className="group relative block overflow-hidden rounded-xl border border-border bg-card hover:border-border-hover transition-all duration-300"
                >
                  {/* Gradient accent */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${accentColors[idx]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  <div className="relative p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-surface text-primary flex items-center justify-center">
                        {iconMap[category.icon]}
                      </div>
                      <ArrowUpRight
                        size={18}
                        className="text-muted group-hover:text-primary transition-colors"
                      />
                    </div>

                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted mb-4">
                      {category.description}
                    </p>

                    {topProduct && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-primary font-semibold">
                          {t('fromPrice', {
                            price: `$${Math.min(...products.map((p) => p.price))}`,
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
