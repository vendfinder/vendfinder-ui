'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Package, Eye, Globe } from 'lucide-react';
import { Product } from '@/types';
import { useFormattedPrice } from '@/hooks/useFormattedPrice';
import { useCart } from '@/context/CartContext';
import { useTranslations } from 'next-intl';
import Rating from '@/components/ui/Rating';
import { useTranslatedProduct } from '@/hooks/useTranslatedProduct';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product: rawProduct }: ProductCardProps) {
  const product = useTranslatedProduct(rawProduct);
  const { addItem } = useCart();
  const t = useTranslations();
  const formatPrice = useFormattedPrice();

  const discountPercent = product.compareAtPrice
    ? Math.round(
        ((product.compareAtPrice - product.price) / product.compareAtPrice) *
          100
      )
    : null;

  return (
    <div className="group bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:border-border-hover hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)] hover:-translate-y-1">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="block relative">
        <div className="aspect-square bg-surface flex items-center justify-center overflow-hidden relative">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <Package
              size={48}
              className="text-muted/15 group-hover:text-muted/25 transition-colors duration-300"
            />
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Quick view hint */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white text-[10px] font-semibold flex items-center gap-1.5">
              <Eye size={11} />
              {t('product.quickView')}
            </span>
          </div>
        </div>
        {product.isSponsored && (
          <span className="absolute top-3 left-3 px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-black/60 text-amber-300 rounded-lg backdrop-blur-sm border border-amber-400/20 shadow-lg">
            Sponsored
          </span>
        )}
        {discountPercent && (
          <span
            className={`absolute ${product.isSponsored ? 'top-10' : 'top-3'} left-3 px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-accent text-white rounded-lg shadow-lg`}
          >
            {t('product.percentOff', { percent: discountPercent })}
          </span>
        )}
        {product.isGlobalListing && (
          <span
            className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-black/60 text-blue-300 rounded-lg backdrop-blur-sm border border-blue-400/20"
            title="Available in multiple languages"
          >
            <Globe size={9} />
            Global
          </span>
        )}
        {product.stockCount && product.stockCount <= 5 && (
          <span
            className={`absolute ${product.isGlobalListing ? 'top-10' : 'top-3'} right-3 px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-black/50 text-amber-300 rounded-lg backdrop-blur-sm border border-amber-400/20`}
          >
            {t('product.lowStock')}
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="p-4">
        <p className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold mb-1.5">
          {product.category.replace('-', ' & ')}
        </p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5">
          <Rating value={product.rating} count={product.reviewCount} />
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-muted line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          <button
            onClick={() => addItem(rawProduct)}
            className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark hover:shadow-[0_0_16px_rgba(232,136,58,0.3)] transition-all cursor-pointer"
            aria-label={t('product.addToCartAriaLabel', { name: product.name })}
          >
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
