'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  Gavel,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  MoreHorizontal,
  XCircle,
  DollarSign,
  ArrowUpRight,
  Edit3,
  Trash2,
  Plus,
  Search,
  ChevronRight,
  ExternalLink,
  TrendingDown,
  X,
  MapPin,
  CreditCard,
  MessageCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDashboardData } from '@/hooks/useDashboardData';
import { cancelOrder, confirmDelivery } from '@/lib/api-orders';
import { useAuth } from '@/context/AuthContext';
import Badge from '@/components/ui/Badge';
import { formatPrice, getTrackingUrl, formatCarrierName } from '@/lib/utils';

type Tab = 'bids' | 'orders' | 'pending' | 'history';

export default function BuyingPage() {
  const t = useTranslations('dashboardBuying');
  const [activeTab, setActiveTab] = useState<Tab>('bids');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<Record<
    string,
    unknown
  > | null>(null);
  const { token } = useAuth();
  const { bids, purchases, orders, sellerStats, loading, refetch } =
    useDashboardData();

  const purchaseStatusConfig: Record<
    string,
    {
      variant: 'info' | 'warning' | 'success' | 'error';
      icon: React.ReactNode;
      label: string;
    }
  > = {
    pending_shipment: {
      variant: 'warning',
      icon: <Clock size={10} />,
      label: t('statusAwaitingShipment'),
    },
    shipped: {
      variant: 'info',
      icon: <Truck size={10} />,
      label: t('statusInTransit'),
    },
    delivered: {
      variant: 'success',
      icon: <CheckCircle2 size={10} />,
      label: t('statusDelivered'),
    },
    authenticated: {
      variant: 'success',
      icon: <CheckCircle2 size={10} />,
      label: t('statusAuthenticated'),
    },
    cancelled: {
      variant: 'error',
      icon: <XCircle size={10} />,
      label: t('statusCancelled'),
    },
  };

  const orderStatusConfig: Record<
    string,
    {
      variant: 'info' | 'warning' | 'success' | 'error';
      icon: React.ReactNode;
      label: string;
      bgColor: string;
    }
  > = {
    processing: {
      variant: 'info',
      icon: <Clock size={10} />,
      label: t('statusProcessing'),
      bgColor: 'bg-blue-400',
    },
    shipped: {
      variant: 'warning',
      icon: <Truck size={10} />,
      label: t('statusShipped'),
      bgColor: 'bg-amber-400',
    },
    delivered: {
      variant: 'success',
      icon: <CheckCircle2 size={10} />,
      label: t('statusDelivered'),
      bgColor: 'bg-emerald-400',
    },
    cancelled: {
      variant: 'error',
      icon: <XCircle size={10} />,
      label: t('statusCancelled'),
      bgColor: 'bg-red-400',
    },
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!token || cancelling) return;
    setCancelling(orderId);
    setOpenMenu(null);
    try {
      await cancelOrder(orderId, token);
      refetch();
    } catch {
      // silent
    } finally {
      setCancelling(null);
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    if (!token || confirming) return;
    setConfirming(orderId);
    setOpenMenu(null);
    try {
      await confirmDelivery(orderId, token);
      refetch();
    } catch {
      // silent
    } finally {
      setConfirming(null);
    }
  };

  const activeBids = bids.filter((b) => b.status === 'active');
  const activeOrders = (orders as unknown as Record<string, unknown>[]).filter(
    (o) => !['cancelled', 'refunded'].includes(String(o.status))
  );
  const pendingPurchases = purchases.filter((p) =>
    ['pending_shipment', 'shipped'].includes(p.status)
  );
  const completedPurchases = purchases.filter((p) =>
    ['delivered', 'authenticated'].includes(p.status)
  );

  const tabs: {
    key: Tab;
    label: string;
    count: number;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'bids',
      label: t('activeBids'),
      count: activeBids.length,
      icon: <Gavel size={13} />,
    },
    {
      key: 'orders',
      label: t('orders'),
      count: activeOrders.length,
      icon: <ShoppingBag size={13} />,
    },
    {
      key: 'pending',
      label: t('pending'),
      count: pendingPurchases.length,
      icon: <Clock size={13} />,
    },
    {
      key: 'history',
      label: t('history'),
      count: completedPurchases.length,
      icon: <CheckCircle2 size={13} />,
    },
  ];

  const stats = [
    {
      label: t('activeBids'),
      value: sellerStats.activeBids.toString(),
      icon: Gavel,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/15',
    },
    {
      label: t('pending'),
      value: pendingPurchases.length.toString(),
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      borderColor: 'border-amber-400/15',
    },
    {
      label: t('totalPurchases'),
      value: sellerStats.totalPurchases.toString(),
      icon: Package,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/15',
    },
    {
      label: t('totalSpent'),
      value: formatPrice(purchases.reduce((sum, p) => sum + p.price, 0)),
      icon: DollarSign,
      color: 'text-violet-400',
      bgColor: 'bg-violet-400/10',
      borderColor: 'border-violet-400/15',
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
            <div className="w-8 h-8 rounded-xl bg-blue-400/10 flex items-center justify-center">
              <ShoppingBag size={15} className="text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          </div>
          <p className="text-sm text-muted">{t('subtitle')}</p>
        </div>
        <Link
          href="/products"
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all bg-surface/40 backdrop-blur-sm w-fit"
        >
          <Search size={14} />
          {t('browseProducts')}
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
              <p className="text-2xl font-bold text-foreground tracking-tight">
                {stat.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex gap-1 mb-6 p-1 bg-surface/60 rounded-xl border border-border/60 w-fit backdrop-blur-sm"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setOpenMenu(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
              activeTab === tab.key
                ? 'bg-primary text-white shadow-[0_0_15px_rgba(232,136,58,0.15)]'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                activeTab === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-surface text-muted/70'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="bg-card rounded-2xl border border-border overflow-hidden"
      >
        <AnimatePresence mode="popLayout">
          {/* ─── ACTIVE BIDS TAB ─── */}
          {activeTab === 'bids' && (
            <motion.div
              key="bids"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Table header */}
              <div className="hidden sm:grid grid-cols-[1fr_95px_95px_95px_95px_50px] gap-3 px-5 py-3 border-b border-white/[0.04] bg-white/[0.01]">
                <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold">
                  {t('headerItem')}
                </span>
                <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">
                  {t('headerYourBid')}
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
                <span />
              </div>

              <div className="divide-y divide-white/[0.04]">
                {activeBids.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                      <Gavel size={24} className="text-muted/30" />
                    </div>
                    <p className="text-foreground font-medium">
                      {t('noActiveBids')}
                    </p>
                    <p className="text-sm text-muted mt-1 mb-4">
                      {t('noActiveBidsDescription')}
                    </p>
                    <Link
                      href="/products"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors"
                    >
                      <Search size={14} />
                      {t('browseProducts')}
                    </Link>
                  </div>
                ) : (
                  activeBids.map((bid, i) => {
                    const spread = bid.lowestAsk
                      ? bid.lowestAsk - bid.bidAmount
                      : null;
                    return (
                      <motion.div
                        key={bid.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.04 }}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_95px_95px_95px_95px_50px] gap-2 sm:gap-3 items-center px-5 py-4 hover:bg-white/[0.015] transition-colors group relative"
                      >
                        {/* Product */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-muted/30 shrink-0 group-hover:border-border-hover transition-colors">
                            <ShoppingBag size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {bid.productName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {bid.size && (
                                <span className="text-[11px] text-muted bg-surface px-1.5 py-0.5 rounded">
                                  {bid.size}
                                </span>
                              )}
                              <span className="text-[11px] text-muted capitalize">
                                {bid.category}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Your Bid */}
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-400">
                            {formatPrice(bid.bidAmount)}
                          </p>
                          {spread !== null && (
                            <span className="text-[9px] text-muted mt-0.5 block">
                              ${spread} {t('belowAsk')}
                            </span>
                          )}
                        </div>

                        {/* Lowest Ask */}
                        <div className="text-right hidden sm:block">
                          <p
                            className={`text-sm ${bid.lowestAsk ? 'text-foreground/80' : 'text-muted/30'}`}
                          >
                            {bid.lowestAsk
                              ? formatPrice(bid.lowestAsk)
                              : '\u2014'}
                          </p>
                        </div>

                        {/* Highest Bid */}
                        <div className="text-right hidden sm:block">
                          <p
                            className={`text-sm ${bid.highestBid ? 'text-foreground/80' : 'text-muted/30'}`}
                          >
                            {bid.highestBid
                              ? formatPrice(bid.highestBid)
                              : '\u2014'}
                          </p>
                          {bid.highestBid === bid.bidAmount && (
                            <span className="text-[9px] font-semibold text-emerald-400 flex items-center justify-end gap-0.5 mt-0.5">
                              <ArrowUpRight size={8} /> {t('highest')}
                            </span>
                          )}
                        </div>

                        {/* Last Sale */}
                        <div className="text-right hidden sm:block">
                          <p
                            className={`text-sm ${bid.lastSale ? 'text-foreground/80' : 'text-muted/30'}`}
                          >
                            {bid.lastSale
                              ? formatPrice(bid.lastSale)
                              : '\u2014'}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="text-right relative">
                          <button
                            onClick={() =>
                              setOpenMenu(openMenu === bid.id ? null : bid.id)
                            }
                            className="p-1.5 rounded-lg hover:bg-surface text-muted/50 hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          <AnimatePresence>
                            {openMenu === bid.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-xl shadow-xl shadow-black/20 overflow-hidden z-20"
                              >
                                <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                                  <Edit3 size={12} className="text-muted" />
                                  {t('editBid')}
                                </button>
                                <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                                  <ExternalLink
                                    size={12}
                                    className="text-muted"
                                  />
                                  {t('viewProduct')}
                                </button>
                                <div className="border-t border-border" />
                                <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-error hover:bg-red-500/5 transition-colors">
                                  <Trash2 size={12} />
                                  {t('cancelBid')}
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {activeBids.length > 0 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04] bg-white/[0.01]">
                  <p className="text-[11px] text-muted">
                    <span className="font-semibold text-foreground">
                      {activeBids.length}
                    </span>{' '}
                    {activeBids.length !== 1
                      ? t('activeBidsPlural')
                      : t('activeBidSingular')}
                  </p>
                  <span className="text-[11px] text-muted">
                    {t('totalBidValue')}:{' '}
                    <span className="font-semibold text-foreground">
                      {formatPrice(
                        activeBids.reduce((sum, b) => sum + b.bidAmount, 0)
                      )}
                    </span>
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── ORDERS TAB ─── */}
          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Table header */}
              <div className="hidden sm:grid grid-cols-[1fr_100px_100px_50px] gap-3 px-5 py-3 border-b border-white/[0.04] bg-white/[0.01]">
                <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold">
                  {t('headerProduct')}
                </span>
                <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">
                  {t('headerTotal')}
                </span>
                <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">
                  {t('headerStatus')}
                </span>
                <span />
              </div>

              <div className="divide-y divide-white/[0.04]">
                {activeOrders.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag size={24} className="text-muted/30" />
                    </div>
                    <p className="text-foreground font-medium">
                      {t('noOrdersYet')}
                    </p>
                    <p className="text-sm text-muted mt-1 mb-4">
                      {t('noOrdersDescription')}
                    </p>
                    <Link
                      href="/products"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors"
                    >
                      <Search size={14} />
                      {t('browseProducts')}
                    </Link>
                  </div>
                ) : (
                  activeOrders.map((order, i) => {
                    const status = (order.status as string) || 'processing';
                    const config =
                      orderStatusConfig[status] || orderStatusConfig.processing;
                    const trackingNumber = order.tracking_number as
                      | string
                      | undefined;
                    const carrier = order.carrier as string | undefined;
                    const productName = (order.product_name as string) || '';
                    const total = parseFloat(
                      String(order.total_buyer_pays || 0)
                    );
                    const orderDate = order.created_at
                      ? new Date(
                          order.created_at as string
                        ).toLocaleDateString()
                      : '';
                    const orderId = order.id as string;
                    return (
                      <motion.div
                        key={orderId}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.04 }}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_50px] gap-2 sm:gap-3 items-center px-5 py-4 hover:bg-white/[0.015] transition-colors group"
                      >
                        {/* Product info */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-muted/30 shrink-0 group-hover:border-border-hover transition-colors relative overflow-hidden">
                            {order.product_image ? (
                              <Image
                                src={order.product_image as string}
                                alt={productName}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <Package size={18} />
                            )}
                            <div
                              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${config.bgColor} z-10`}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {productName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-muted">
                                {order.order_number as string} &middot;{' '}
                                {orderDate}
                              </span>
                            </div>
                            {trackingNumber &&
                              (() => {
                                const url = getTrackingUrl(
                                  carrier,
                                  trackingNumber
                                );
                                const label = `${formatCarrierName(carrier)} ${trackingNumber}`;
                                return url ? (
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[10px] font-mono text-primary/80 bg-primary/[0.05] hover:bg-primary/[0.1] px-1.5 py-0.5 rounded-md w-fit mt-1 inline-block"
                                  >
                                    {label}
                                  </a>
                                ) : (
                                  <p className="text-[10px] font-mono text-primary/80 bg-primary/[0.05] px-1.5 py-0.5 rounded-md w-fit mt-1">
                                    {label}
                                  </p>
                                );
                              })()}
                          </div>
                        </div>

                        {/* Total */}
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">
                            {formatPrice(total)}
                          </p>
                        </div>

                        {/* Status */}
                        <div className="text-right">
                          <Badge variant={config.variant}>
                            <span className="flex items-center gap-1">
                              {config.icon}
                              {config.label}
                            </span>
                          </Badge>
                        </div>

                        {/* Actions */}
                        <div className="text-right relative">
                          <button
                            onClick={() =>
                              setOpenMenu(openMenu === orderId ? null : orderId)
                            }
                            className="p-1.5 rounded-lg hover:bg-surface text-muted/50 hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          <AnimatePresence>
                            {openMenu === orderId && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-xl shadow-xl shadow-black/20 overflow-hidden z-20"
                              >
                                <button
                                  onClick={() => {
                                    setDetailOrder(order);
                                    setOpenMenu(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                                >
                                  <ExternalLink
                                    size={12}
                                    className="text-muted"
                                  />
                                  {t('viewDetails')}
                                </button>
                                {['processing', 'pending_payment'].includes(
                                  status
                                ) && (
                                  <>
                                    <div className="border-t border-border" />
                                    <button
                                      onClick={() => handleCancelOrder(orderId)}
                                      disabled={cancelling === orderId}
                                      className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-error hover:bg-red-500/5 transition-colors disabled:opacity-50"
                                    >
                                      <XCircle size={12} />
                                      {cancelling === orderId
                                        ? t('cancellingOrder')
                                        : t('cancelOrder')}
                                    </button>
                                  </>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {activeOrders.length > 0 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04] bg-white/[0.01]">
                  <p className="text-[11px] text-muted">
                    <span className="font-semibold text-foreground">
                      {activeOrders.length}
                    </span>{' '}
                    {activeOrders.length !== 1
                      ? t('ordersPlural')
                      : t('orderSingular')}
                  </p>
                  <span className="text-[11px] text-muted">
                    {t('total')}:{' '}
                    <span className="font-semibold text-foreground">
                      {formatPrice(
                        activeOrders.reduce(
                          (sum, o) =>
                            sum + parseFloat(String(o.total_buyer_pays || 0)),
                          0
                        )
                      )}
                    </span>
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── PENDING TAB ─── */}
          {activeTab === 'pending' && (
            <motion.div
              key="pending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="divide-y divide-white/[0.04]">
                {pendingPurchases.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                      <Package size={24} className="text-muted/30" />
                    </div>
                    <p className="text-foreground font-medium">
                      {t('noPendingPurchases')}
                    </p>
                    <p className="text-sm text-muted mt-1">
                      {t('noPendingDescription')}
                    </p>
                  </div>
                ) : (
                  pendingPurchases.map((purchase, i) => {
                    const config = purchaseStatusConfig[purchase.status];
                    return (
                      <motion.div
                        key={purchase.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="flex items-center gap-4 px-5 py-5 hover:bg-white/[0.015] transition-colors group"
                      >
                        <div className="w-14 h-14 rounded-xl bg-surface border border-border flex items-center justify-center text-muted/30 shrink-0 group-hover:border-border-hover transition-colors relative overflow-hidden">
                          {purchase.productImage ? (
                            <Image
                              src={purchase.productImage}
                              alt={purchase.productName}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <Package size={22} />
                          )}
                          {/* Status dot */}
                          <div
                            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card z-10 ${
                              purchase.status === 'shipped'
                                ? 'bg-blue-400'
                                : 'bg-amber-400'
                            }`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {purchase.productName}
                          </p>
                          <p className="text-[11px] text-muted mt-0.5">
                            {purchase.size && `${purchase.size} \u00b7 `}
                            {t('from')}{' '}
                            <span className="text-foreground/70">
                              {purchase.sellerName}
                            </span>
                            {' \u00b7 '}
                            {purchase.date}
                          </p>
                          {purchase.trackingNumber && (
                            <p className="text-[11px] text-primary/80 mt-1.5 font-mono bg-primary/[0.05] px-2 py-0.5 rounded-md w-fit">
                              {purchase.trackingNumber}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                          <p className="text-sm font-bold text-foreground">
                            {formatPrice(purchase.price)}
                          </p>
                          <Badge variant={config.variant}>
                            <span className="flex items-center gap-1">
                              {config.icon}
                              {config.label}
                            </span>
                          </Badge>
                          {purchase.status === 'pending_shipment' && (
                            <button
                              onClick={() => handleCancelOrder(purchase.id)}
                              disabled={cancelling === purchase.id}
                              className="text-[10px] text-muted hover:text-error transition-colors mt-1 disabled:opacity-50"
                            >
                              {cancelling === purchase.id
                                ? t('cancellingOrder')
                                : t('cancelOrder')}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* ─── HISTORY TAB ─── */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="divide-y divide-white/[0.04]">
                {completedPurchases.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag size={24} className="text-muted/30" />
                    </div>
                    <p className="text-foreground font-medium">
                      {t('noPurchaseHistory')}
                    </p>
                    <p className="text-sm text-muted mt-1">
                      {t('noPurchaseHistoryDescription')}
                    </p>
                  </div>
                ) : (
                  completedPurchases.map((purchase, i) => {
                    const config = purchaseStatusConfig[purchase.status];
                    return (
                      <motion.div
                        key={purchase.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="flex items-center gap-4 px-5 py-5 hover:bg-white/[0.015] transition-colors group"
                      >
                        <div className="w-14 h-14 rounded-xl bg-surface border border-border flex items-center justify-center text-muted/30 shrink-0 group-hover:border-border-hover transition-colors relative overflow-hidden">
                          {purchase.productImage ? (
                            <Image
                              src={purchase.productImage}
                              alt={purchase.productName}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <Package size={22} />
                          )}
                          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card bg-emerald-400 z-10" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {purchase.productName}
                          </p>
                          <p className="text-[11px] text-muted mt-0.5">
                            {purchase.size && `${purchase.size} \u00b7 `}
                            {t('from')}{' '}
                            <span className="text-foreground/70">
                              {purchase.sellerName}
                            </span>
                            {' \u00b7 '}
                            {purchase.date}
                          </p>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                          <p className="text-sm font-bold text-foreground">
                            {formatPrice(purchase.price)}
                          </p>
                          <Badge variant="success">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              {config.label}
                            </span>
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* History footer */}
              {completedPurchases.length > 0 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04] bg-white/[0.01]">
                  <p className="text-[11px] text-muted">
                    <span className="font-semibold text-foreground">
                      {completedPurchases.length}
                    </span>{' '}
                    {completedPurchases.length !== 1
                      ? t('completedPurchasesPlural')
                      : t('completedPurchaseSingular')}
                  </p>
                  <span className="text-[11px] text-muted">
                    {t('totalSpentLabel')}:{' '}
                    <span className="font-semibold text-foreground">
                      {formatPrice(
                        completedPurchases.reduce((sum, p) => sum + p.price, 0)
                      )}
                    </span>
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {detailOrder && (
          <OrderDetailModal
            order={detailOrder}
            onClose={() => setDetailOrder(null)}
            onCancel={(id) => {
              handleCancelOrder(id);
              setDetailOrder(null);
            }}
            onConfirm={(id) => {
              handleConfirmDelivery(id);
              setDetailOrder(null);
            }}
            cancelling={cancelling}
            confirming={confirming}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function OrderDetailModal({
  order: o,
  onClose,
  onCancel,
  onConfirm,
  cancelling,
  confirming,
}: {
  order: Record<string, unknown>;
  onClose: () => void;
  onCancel: (id: string) => void;
  onConfirm: (id: string) => void;
  cancelling: string | null;
  confirming: string | null;
}) {
  const t = useTranslations('dashboardBuying');
  const status = String(o.status || 'processing');

  const orderStatusConfig: Record<
    string,
    {
      variant: 'info' | 'warning' | 'success' | 'error';
      icon: React.ReactNode;
      label: string;
      bgColor: string;
    }
  > = {
    processing: {
      variant: 'info',
      icon: <Clock size={10} />,
      label: t('statusProcessing'),
      bgColor: 'bg-blue-400',
    },
    shipped: {
      variant: 'warning',
      icon: <Truck size={10} />,
      label: t('statusShipped'),
      bgColor: 'bg-amber-400',
    },
    delivered: {
      variant: 'success',
      icon: <CheckCircle2 size={10} />,
      label: t('statusDelivered'),
      bgColor: 'bg-emerald-400',
    },
    cancelled: {
      variant: 'error',
      icon: <XCircle size={10} />,
      label: t('statusCancelled'),
      bgColor: 'bg-red-400',
    },
  };

  const config = orderStatusConfig[status] || orderStatusConfig.processing;
  const total = parseFloat(String(o.total_buyer_pays || 0));
  const itemPrice = parseFloat(String(o.item_price || 0));
  const shippingFee = parseFloat(String(o.shipping_fee || 0));
  const taxAmount = parseFloat(String(o.tax_amount || 0));
  const orderId = String(o.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-foreground">
              {t('orderDetails')}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {String(o.order_number)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-surface transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Product */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-surface border border-border flex items-center justify-center text-muted/30 shrink-0 overflow-hidden relative">
              {o.product_image ? (
                <Image
                  src={String(o.product_image)}
                  alt={String(o.product_name)}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <Package size={20} />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {String(o.product_name)}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {o.size ? (
                  <span className="text-[11px] text-muted bg-surface px-1.5 py-0.5 rounded">
                    {String(o.size)}
                  </span>
                ) : null}
                <Badge variant={config.variant}>
                  <span className="flex items-center gap-1">
                    {config.icon}
                    {config.label}
                  </span>
                </Badge>
              </div>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="bg-surface/60 rounded-xl border border-border/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                <CreditCard size={12} className="text-emerald-400" />
              </div>
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                {t('payment')}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">{t('itemPrice')}</span>
                <span className="text-foreground font-medium">
                  {formatPrice(itemPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t('tax')}</span>
                <span className="text-foreground font-medium">
                  {formatPrice(taxAmount)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="text-foreground font-bold">{t('total')}</span>
                <span className="text-foreground font-bold">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          {o.shipping_name ? (
            <div className="bg-surface/60 rounded-xl border border-border/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-blue-400/10 flex items-center justify-center">
                  <MapPin size={12} className="text-blue-400" />
                </div>
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {t('shippingAddress')}
                </span>
              </div>
              <div className="text-sm text-foreground space-y-0.5">
                <p className="font-medium">{String(o.shipping_name)}</p>
                <p className="text-muted">{String(o.shipping_address_line1)}</p>
                {o.shipping_address_line2 ? (
                  <p className="text-muted">
                    {String(o.shipping_address_line2)}
                  </p>
                ) : null}
                <p className="text-muted">
                  {String(o.shipping_city)}, {String(o.shipping_state)}{' '}
                  {String(o.shipping_zip)}
                </p>
              </div>
            </div>
          ) : null}

          {/* Tracking */}
          {o.tracking_number ? (
            <div className="bg-surface/60 rounded-xl border border-border/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-amber-400/10 flex items-center justify-center">
                  <Truck size={12} className="text-amber-400" />
                </div>
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {t('tracking')}
                </span>
              </div>
              {(() => {
                const carrier = String(o.carrier || '');
                const trackingNumber = String(o.tracking_number);
                const url = getTrackingUrl(carrier, trackingNumber);
                const label = `${formatCarrierName(carrier)} · ${trackingNumber}`;
                return url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-primary hover:underline inline-flex items-center gap-1.5"
                  >
                    {label}
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <p className="text-sm font-mono text-primary">{label}</p>
                );
              })()}
              {o.shipped_at ? (
                <p className="text-[11px] text-muted mt-1">
                  {t('shippedOn', {
                    date: new Date(String(o.shipped_at)).toLocaleDateString(),
                  })}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Order timeline */}
          <div className="text-[11px] text-muted space-y-1">
            <p>
              {t('ordered')} {new Date(String(o.created_at)).toLocaleString()}
            </p>
            {o.shipped_at ? (
              <p>
                {t('shipped')} {new Date(String(o.shipped_at)).toLocaleString()}
              </p>
            ) : null}
            {o.delivered_at ? (
              <p>
                {t('delivered')}{' '}
                {new Date(String(o.delivered_at)).toLocaleString()}
              </p>
            ) : null}
          </div>

          {/* Message Seller */}
          {o.seller_id ? (
            <Link
              href={`/dashboard/messages?seller=${String(o.seller_id)}`}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all"
            >
              <MessageCircle size={14} />
              {t('messageSeller')}
            </Link>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted hover:text-foreground hover:border-border-hover transition-all"
          >
            {t('close')}
          </button>
          {['processing', 'pending_payment'].includes(status) && (
            <button
              onClick={() => onCancel(orderId)}
              disabled={cancelling === orderId}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-500/20 text-error text-sm font-medium hover:bg-red-500/5 transition-all disabled:opacity-50"
            >
              <XCircle size={14} />
              {t('cancelOrder')}
            </button>
          )}
          {status === 'shipped' && (
            <button
              onClick={() => onConfirm(orderId)}
              disabled={confirming === orderId}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 size={14} />
              {confirming === orderId
                ? t('confirmingDelivery')
                : t('confirmDelivery')}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
