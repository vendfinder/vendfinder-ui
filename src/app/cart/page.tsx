'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Package,
  ArrowRight,
  Shield,
  Truck,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export default function CartPage() {
  const { items, totalPrice, removeItem, updateQuantity } = useCart();
  const t = useTranslations();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-5">
            <ShoppingBag size={32} className="text-muted/30" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t('cart.emptyTitle')}
          </h1>
          <p className="text-sm text-muted mb-6">{t('cart.emptyDesc')}</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] transition-all"
          >
            {t('common.browseProducts')}
            <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    );
  }

  const shipping = totalPrice >= 50 ? 0 : 5.99;
  const tax = totalPrice * 0.08;
  const grandTotal = totalPrice + shipping + tax;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShoppingBag size={15} className="text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t('cart.shoppingCart')}
          </h1>
        </div>
        <p className="text-sm text-muted">
          {t('cart.itemsInCart', { count: items.length })}
        </p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Items */}
        <div className="flex-1 space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={`${item.product.id}-${item.size || 'default'}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex gap-4 p-4 bg-card rounded-2xl border border-border hover:border-border-hover transition-all group"
            >
              <div className="w-24 h-24 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0 group-hover:border-border-hover transition-colors overflow-hidden">
                {item.product.images?.[0] ? (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package size={28} className="text-muted/20" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.product.slug}`}
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {item.product.name}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-muted capitalize">
                    {item.product.category.replace('-', ' & ')}
                  </span>
                  {item.size && (
                    <>
                      <span className="text-muted/30">&middot;</span>
                      <span className="text-[11px] text-muted bg-surface px-1.5 py-0.5 rounded">
                        {item.product.category === 'sneakers'
                          ? t('cart.sizeUS', { size: item.size })
                          : item.size}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm font-bold text-foreground mt-2">
                  {formatPrice(item.product.price)}
                </p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => removeItem(item.product.id, item.size)}
                  className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
                <div className="flex items-center border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.product.id,
                        item.quantity - 1,
                        item.size
                      )
                    }
                    className="px-2.5 py-1.5 text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="px-3 py-1.5 text-sm font-semibold border-x border-border min-w-[36px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.product.id,
                        item.quantity + 1,
                        item.size
                      )
                    }
                    className="px-2.5 py-1.5 text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-full lg:w-80"
        >
          <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-5">
              {t('cart.orderSummary')}
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted">
                <span>{t('cart.subtotal')}</span>
                <span className="text-foreground font-medium">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>{t('cart.shipping')}</span>
                <span
                  className={
                    shipping === 0
                      ? 'text-emerald-400 font-medium'
                      : 'text-foreground font-medium'
                  }
                >
                  {shipping === 0 ? t('common.free') : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>{t('cart.tax')}</span>
                <span className="text-foreground font-medium">
                  {formatPrice(tax)}
                </span>
              </div>
              <div className="border-t border-white/[0.06] pt-3 flex justify-between font-bold text-foreground text-base">
                <span>{t('cart.total')}</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="flex items-center justify-center gap-2 w-full mt-6 px-6 py-3.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all"
            >
              {t('cart.proceedToCheckout')}
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/products"
              className="flex items-center justify-center w-full mt-2 px-6 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface transition-all"
            >
              {t('common.continueShopping')}
            </Link>

            {/* Trust signals */}
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/[0.04] text-[10px] text-muted">
              <span className="flex items-center gap-1">
                <Shield size={10} className="text-emerald-400" />
                {t('cart.secure')}
              </span>
              <span className="flex items-center gap-1">
                <Truck size={10} className="text-blue-400" />
                {t('cart.fastDelivery')}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
