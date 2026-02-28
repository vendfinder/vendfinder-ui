"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
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
} from "lucide-react";
import { bids, purchases, sellerStats } from "@/data/seller";
import Badge from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";

type Tab = "bids" | "pending" | "history";

const purchaseStatusConfig: Record<
  string,
  { variant: "info" | "warning" | "success" | "error"; icon: React.ReactNode; label: string }
> = {
  pending_shipment: { variant: "warning", icon: <Clock size={10} />, label: "Awaiting Shipment" },
  shipped: { variant: "info", icon: <Truck size={10} />, label: "In Transit" },
  delivered: { variant: "success", icon: <CheckCircle2 size={10} />, label: "Delivered" },
  authenticated: { variant: "success", icon: <CheckCircle2 size={10} />, label: "Authenticated" },
  cancelled: { variant: "error", icon: <XCircle size={10} />, label: "Cancelled" },
};

export default function BuyingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("bids");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const activeBids = bids.filter((b) => b.status === "active");
  const pendingPurchases = purchases.filter((p) =>
    ["pending_shipment", "shipped"].includes(p.status)
  );
  const completedPurchases = purchases.filter((p) =>
    ["delivered", "authenticated"].includes(p.status)
  );

  const tabs: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: "bids", label: "Active Bids", count: activeBids.length, icon: <Gavel size={13} /> },
    { key: "pending", label: "Pending", count: pendingPurchases.length, icon: <Clock size={13} /> },
    { key: "history", label: "History", count: completedPurchases.length, icon: <CheckCircle2 size={13} /> },
  ];

  const stats = [
    {
      label: "Active Bids",
      value: sellerStats.activeBids.toString(),
      icon: Gavel,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/15",
    },
    {
      label: "Pending",
      value: pendingPurchases.length.toString(),
      icon: Clock,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      borderColor: "border-amber-400/15",
    },
    {
      label: "Total Purchases",
      value: sellerStats.totalPurchases.toString(),
      icon: Package,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      borderColor: "border-blue-400/15",
    },
    {
      label: "Total Spent",
      value: formatPrice(purchases.reduce((sum, p) => sum + p.price, 0)),
      icon: DollarSign,
      color: "text-violet-400",
      bgColor: "bg-violet-400/10",
      borderColor: "border-violet-400/15",
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
            <h1 className="text-2xl font-bold text-foreground">Buying</h1>
          </div>
          <p className="text-sm text-muted">Manage your bids, purchases, and order history</p>
        </div>
        <Link
          href="/products"
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all bg-surface/40 backdrop-blur-sm w-fit"
        >
          <Search size={14} />
          Browse Products
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
                <div className={`w-9 h-9 rounded-xl ${stat.bgColor} ${stat.color} flex items-center justify-center`}>
                  <Icon size={16} />
                </div>
                <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</p>
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
            onClick={() => { setActiveTab(tab.key); setOpenMenu(null); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
              activeTab === tab.key
                ? "bg-primary text-white shadow-[0_0_15px_rgba(232,136,58,0.15)]"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                activeTab === tab.key
                  ? "bg-white/20 text-white"
                  : "bg-surface text-muted/70"
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
          {activeTab === "bids" && (
            <motion.div key="bids" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Table header */}
              <div className="hidden sm:grid grid-cols-[1fr_95px_95px_95px_95px_50px] gap-3 px-5 py-3 border-b border-white/[0.04] bg-white/[0.01]">
                <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold">Item</span>
                <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">Your Bid</span>
                <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">Lowest Ask</span>
                <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">Highest Bid</span>
                <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">Last Sale</span>
                <span />
              </div>

              <div className="divide-y divide-white/[0.04]">
                {activeBids.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                      <Gavel size={24} className="text-muted/30" />
                    </div>
                    <p className="text-foreground font-medium">No active bids</p>
                    <p className="text-sm text-muted mt-1 mb-4">Place bids on products to get the best deals.</p>
                    <Link
                      href="/products"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors"
                    >
                      <Search size={14} />
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  activeBids.map((bid, i) => {
                    const spread = bid.lowestAsk ? bid.lowestAsk - bid.bidAmount : null;
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
                              <span className="text-[11px] text-muted capitalize">{bid.category}</span>
                            </div>
                          </div>
                        </div>

                        {/* Your Bid */}
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-400">{formatPrice(bid.bidAmount)}</p>
                          {spread !== null && (
                            <span className="text-[9px] text-muted mt-0.5 block">
                              ${spread} below ask
                            </span>
                          )}
                        </div>

                        {/* Lowest Ask */}
                        <div className="text-right hidden sm:block">
                          <p className={`text-sm ${bid.lowestAsk ? "text-foreground/80" : "text-muted/30"}`}>
                            {bid.lowestAsk ? formatPrice(bid.lowestAsk) : "—"}
                          </p>
                        </div>

                        {/* Highest Bid */}
                        <div className="text-right hidden sm:block">
                          <p className={`text-sm ${bid.highestBid ? "text-foreground/80" : "text-muted/30"}`}>
                            {bid.highestBid ? formatPrice(bid.highestBid) : "—"}
                          </p>
                          {bid.highestBid === bid.bidAmount && (
                            <span className="text-[9px] font-semibold text-emerald-400 flex items-center justify-end gap-0.5 mt-0.5">
                              <ArrowUpRight size={8} /> Highest
                            </span>
                          )}
                        </div>

                        {/* Last Sale */}
                        <div className="text-right hidden sm:block">
                          <p className={`text-sm ${bid.lastSale ? "text-foreground/80" : "text-muted/30"}`}>
                            {bid.lastSale ? formatPrice(bid.lastSale) : "—"}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="text-right relative">
                          <button
                            onClick={() => setOpenMenu(openMenu === bid.id ? null : bid.id)}
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
                                  Edit Bid
                                </button>
                                <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                                  <ExternalLink size={12} className="text-muted" />
                                  View Product
                                </button>
                                <div className="border-t border-border" />
                                <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-error hover:bg-red-500/5 transition-colors">
                                  <Trash2 size={12} />
                                  Cancel Bid
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
                    <span className="font-semibold text-foreground">{activeBids.length}</span> active bid{activeBids.length !== 1 ? "s" : ""}
                  </p>
                  <span className="text-[11px] text-muted">
                    Total bid value:{" "}
                    <span className="font-semibold text-foreground">
                      {formatPrice(activeBids.reduce((sum, b) => sum + b.bidAmount, 0))}
                    </span>
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── PENDING TAB ─── */}
          {activeTab === "pending" && (
            <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="divide-y divide-white/[0.04]">
                {pendingPurchases.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                      <Package size={24} className="text-muted/30" />
                    </div>
                    <p className="text-foreground font-medium">No pending purchases</p>
                    <p className="text-sm text-muted mt-1">Your pending orders will appear here.</p>
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
                        <div className="w-14 h-14 rounded-xl bg-surface border border-border flex items-center justify-center text-muted/30 shrink-0 group-hover:border-border-hover transition-colors relative">
                          <Package size={22} />
                          {/* Status dot */}
                          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${
                            purchase.status === "shipped" ? "bg-blue-400" : "bg-amber-400"
                          }`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {purchase.productName}
                          </p>
                          <p className="text-[11px] text-muted mt-0.5">
                            {purchase.size && `${purchase.size} · `}from{" "}
                            <span className="text-foreground/70">{purchase.sellerName}</span>
                            {" · "}{purchase.date}
                          </p>
                          {purchase.trackingNumber && (
                            <p className="text-[11px] text-primary/80 mt-1.5 font-mono bg-primary/[0.05] px-2 py-0.5 rounded-md w-fit">
                              {purchase.trackingNumber}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                          <p className="text-sm font-bold text-foreground">{formatPrice(purchase.price)}</p>
                          <Badge variant={config.variant}>
                            <span className="flex items-center gap-1">
                              {config.icon}
                              {config.label}
                            </span>
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* ─── HISTORY TAB ─── */}
          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="divide-y divide-white/[0.04]">
                {completedPurchases.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag size={24} className="text-muted/30" />
                    </div>
                    <p className="text-foreground font-medium">No purchase history</p>
                    <p className="text-sm text-muted mt-1">Your completed purchases will appear here.</p>
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
                        <div className="w-14 h-14 rounded-xl bg-surface border border-border flex items-center justify-center text-muted/30 shrink-0 group-hover:border-border-hover transition-colors relative">
                          <Package size={22} />
                          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card bg-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {purchase.productName}
                          </p>
                          <p className="text-[11px] text-muted mt-0.5">
                            {purchase.size && `${purchase.size} · `}from{" "}
                            <span className="text-foreground/70">{purchase.sellerName}</span>
                            {" · "}{purchase.date}
                          </p>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                          <p className="text-sm font-bold text-foreground">{formatPrice(purchase.price)}</p>
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
                    <span className="font-semibold text-foreground">{completedPurchases.length}</span> completed purchase{completedPurchases.length !== 1 ? "s" : ""}
                  </p>
                  <span className="text-[11px] text-muted">
                    Total spent:{" "}
                    <span className="font-semibold text-foreground">
                      {formatPrice(completedPurchases.reduce((sum, p) => sum + p.price, 0))}
                    </span>
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
