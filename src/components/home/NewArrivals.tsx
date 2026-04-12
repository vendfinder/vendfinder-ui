'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import Button from '@/components/ui/Button';
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion/MotionWrapper';

export default function NewArrivals({ products }: { products: Product[] }) {
  const t = useTranslations('newArrivals');
  const arrivals = products;

  return (
    <section className="py-16 lg:py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-primary" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  {t('badge')}
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground tracking-tight">
                {t('title')}
              </h2>
            </div>
            <Button
              href="/products"
              variant="ghost"
              className="hidden sm:inline-flex text-muted hover:text-primary"
            >
              {t('seeAll')} <ArrowRight size={16} className="ml-1" />
            </Button>
          </div>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
          {arrivals.map((product) => (
            <StaggerItem key={product.id}>
              <ProductCard product={product} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="mt-10 text-center sm:hidden">
          <Button
            href="/products"
            variant="outline"
            className="border-border text-foreground hover:border-primary hover:text-primary"
          >
            {t('viewAllProducts')} <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}
