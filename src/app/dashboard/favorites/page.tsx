'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Heart,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  MoreHorizontal,
  Bell,
  BellRing,
  ExternalLink,
  DollarSign,
  Eye,
  ShoppingCart,
  SlidersHorizontal,
  Search,
  Flame,
  Package,
} from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { formatPrice } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { FavoriteItem } from '@/types';

type SortKey = 'recent' | 'price-high' | 'price-low' | 'change';

function sortFavorites(items: FavoriteItem[], key: SortKey) {
  const sorted = [...items];
  switch (key) {
    case 'price-high':
      return sorted.sort((a, b) => b.lastSale - a.lastSale);
    case 'price-low':
      return sorted.sort((a, b) => a.lastSale - b.lastSale);
    case 'change':
      return sorted.sort(
        (a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange)
      );
    default:
      return sorted;
  }
}

export default function FavoritesPage() {
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const { favorites, loading } = useDashboardData();
  const t = useTranslations('dashboardFavorites');

  const sortedFavorites = sortFavorites(favorites, sortKey);

  const totalValue = favorites.reduce((sum, f) => sum + f.lastSale, 0);
  const avgChange =
    favorites.reduce((sum, f) => sum + f.priceChange, 0) / favorites.length;
  const gainers = favorites.filter((f) => f.priceChange > 0).length;
  const decliners = favorites.filter((f) => f.priceChange < 0).length;

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'recent', label: t('sortRecentlyAdded') },
    { key: 'price-high', label: t('sortPriceHighToLow') },
    { key: 'price-low', label: t('sortPriceLowToHigh') },
    { key: 'change', label: t('sortBiggestMovers') },
  ];

  const stats = [
    {
      label: t('statWatching'),
      value: favorites.length.toString(),
      icon: Heart,
      color: 'text-rose-400',
      bgColor: 'bg-rose-400/10',
      borderColor: 'border-rose-400/15',
    },
    {
      label: t('statWatchlistValue'),
      value: formatPrice(totalValue),
      icon: DollarSign,
      color: 'text-violet-400',
      bgColor: 'bg-violet-400/10',
      borderColor: 'border-violet-400/15',
    },
    {
      label: t('statTrendingUp'),
      value: gainers.toString(),
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      borderColor: 'border-emerald-400/15',
    },
    {
      label: t('statAvgChange'),
      value: `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(1)}%`,
      icon: Flame,
      color: avgChange >= 0 ? 'text-emerald-400' : 'text-red-400',
      bgColor: avgChange >= 0 ? 'bg-emerald-400/10' : 'bg-red-400/10',
      borderColor:
        avgChange >= 0 ? 'border-emerald-400/15' : 'border-red-400/15',
    },
  ];

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
      >
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-rose-400/10 flex items-center justify-center">
              <Heart size={15} className="text-rose-400 fill-rose-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          </div>
          <p className="text-sm text-muted">{t('subtitle')}</p>
        </div>
        <Link
          href="/products"
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:border-rose-400/40 hover:text-rose-400 transition-all bg-surface/40 backdrop-blur-sm w-fit"
        >
          <Search size={14} />
          {t('discoverItems')}
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 + i * 0.06 }}
              className={`bg-card rounded-2xl border ${stat.borderColor} p-5`}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className={`w-9 h-9 rounded-xl ${stat.bgColor} ${stat.color} flex items-center justify-center`}
                >
                  <Icon size={16} />
                </div>
                <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">
                  {stat.label}
                </p>
              </div>
              <p
                className={`text-2xl font-bold tracking-tight ${
                  stat.label === t('statAvgChange')
                    ? avgChange >= 0
                      ? 'text-emerald-400'
                      : 'text-red-400'
                    : stat.label === t('statWatchlistValue')
                      ? 'text-violet-400'
                      : 'text-foreground'
                }`}
              >
                {stat.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Sort bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex gap-1 p-1 bg-surface/60 rounded-xl border border-border/60 w-fit backdrop-blur-sm">
          {sortOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setSortKey(option.key)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                sortKey === option.key
                  ? 'bg-primary text-white shadow-[0_0_15px_rgba(232,136,58,0.15)]'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="bg-card rounded-2xl border border-border overflow-hidden"
      >
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_100px_100px_100px_100px_50px] gap-3 px-5 py-3 border-b border-white/[0.04] bg-white/[0.01]">
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold">
            {t('headerItem')}
          </span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">
            {t('headerLowestAsk')}
          </span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">
            {t('headerHighestBid')}
          </span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">
            {t('headerLastSale')}
          </span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">
            {t('headerChange')}
          </span>
          <span />
        </div>

        <div className="divide-y divide-white/[0.04]">
          <AnimatePresence mode="popLayout">
            {sortedFavorites.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-16 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                  <Heart size={24} className="text-muted/30" />
                </div>
                <p className="text-foreground font-medium">{t('emptyTitle')}</p>
                <p className="text-sm text-muted mt-1 mb-4">{t('emptyDesc')}</p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-400/10 text-rose-400 text-sm font-medium hover:bg-rose-400/15 transition-colors"
                >
                  <Search size={14} />
                  {t('browseProducts')}
                </Link>
              </motion.div>
            ) : (
              sortedFavorites.map((item, i) => {
                const isUp = item.priceChange >= 0;
                const spreadFromBid = item.lowestAsk - item.highestBid;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_100px_100px_50px] gap-2 sm:gap-3 items-center px-5 py-4 hover:bg-white/[0.015] transition-colors group relative"
                  >
                    {/* Product */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-muted/30 shrink-0 group-hover:border-border-hover transition-colors relative">
                        <Package size={18} />
                        {/* Favorite heart */}
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center">
                          <Heart size={8} className="text-white fill-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/products/${item.productId}`}
                          className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block"
                        >
                          {item.productName}
                        </Link>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-muted capitalize">
                            {item.category.replace('-', ' ')}
                          </span>
                          {Math.abs(item.priceChange) >= 8 && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isUp
                                  ? 'bg-emerald-400/10 text-emerald-400'
                                  : 'bg-red-400/10 text-red-400'
                              }`}
                            >
                              {isUp ? t('labelHot') : t('labelDip')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lowest Ask */}
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-400">
                        {formatPrice(item.lowestAsk)}
                      </p>
                      <p className="text-[10px] text-muted sm:hidden mt-0.5">
                        {t('headerLowestAsk')}
                      </p>
                    </div>

                    {/* Highest Bid */}
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-foreground/80">
                        {formatPrice(item.highestBid)}
                      </p>
                      <span className="text-[9px] text-muted mt-0.5 block">
                        ${spreadFromBid} {t('spread')}
                      </span>
                    </div>

                    {/* Last Sale */}
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-foreground/80">
                        {formatPrice(item.lastSale)}
                      </p>
                    </div>

                    {/* Price Change */}
                    <div className="text-right">
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold ${
                          isUp
                            ? 'bg-emerald-400/[0.08] text-emerald-400'
                            : 'bg-red-400/[0.08] text-red-400'
                        }`}
                      >
                        {isUp ? (
                          <TrendingUp size={12} />
                        ) : (
                          <TrendingDown size={12} />
                        )}
                        {isUp ? '+' : ''}
                        {item.priceChange}%
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="text-right relative">
                      <button
                        onClick={() =>
                          setOpenMenu(openMenu === item.id ? null : item.id)
                        }
                        className="p-1.5 rounded-lg hover:bg-surface text-muted/50 hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      <AnimatePresence>
                        {openMenu === item.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-xl shadow-black/20 overflow-hidden z-20"
                          >
                            <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                              <ShoppingCart size={12} className="text-muted" />
                              {t('menuBuyNow')}
                            </button>
                            <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                              <ExternalLink size={12} className="text-muted" />
                              {t('menuViewProduct')}
                            </button>
                            <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                              <BellRing size={12} className="text-muted" />
                              {t('menuPriceAlert')}
                            </button>
                            <div className="border-t border-border" />
                            <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-error hover:bg-red-500/5 transition-colors">
                              <Trash2 size={12} />
                              {t('menuRemove')}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Footer summary */}
        {sortedFavorites.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04] bg-white/[0.01]">
            <p className="text-[11px] text-muted">
              {t('footerWatching')}{' '}
              <span className="font-semibold text-foreground">
                {sortedFavorites.length}
              </span>{' '}
              {t('footerItems', { count: sortedFavorites.length })}
            </p>
            <div className="flex items-center gap-4 text-[11px] text-muted">
              <span>
                <span className="font-semibold text-emerald-400">
                  {gainers}
                </span>{' '}
                {t('footerUp')}
              </span>
              <span className="w-px h-3 bg-white/[0.06]" />
              <span>
                <span className="font-semibold text-red-400">{decliners}</span>{' '}
                {t('footerDown')}
              </span>
              <span className="w-px h-3 bg-white/[0.06]" />
              <span>
                {t('footerTotalValue')}{' '}
                <span className="font-semibold text-foreground">
                  {formatPrice(totalValue)}
                </span>
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
