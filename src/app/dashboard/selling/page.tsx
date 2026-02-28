"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Tag,
  Eye,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Plus,
  DollarSign,
  Package,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ChevronRight,
  Edit3,
  Trash2,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { listings, sellerStats } from "@/data/seller";
import Badge from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";

type Tab = "active" | "pending" | "sold";

const statusConfig: Record<
  string,
  { variant: "info" | "warning" | "success" | "error"; icon: React.ReactNode; color: string }
> = {
  active: { variant: "info", icon: <Tag size={10} />, color: "text-primary" },
  pending: { variant: "warning", icon: <Clock size={10} />, color: "text-amber-400" },
  sold: { variant: "success", icon: <CheckCircle2 size={10} />, color: "text-emerald-400" },
  cancelled: { variant: "error", icon: null, color: "text-error" },
};

export default function SellingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filteredListings = listings.filter((l) => {
    if (activeTab === "active") return l.status === "active";
    if (activeTab === "pending") return l.status === "pending";
    if (activeTab === "sold") return l.status === "sold";
    return true;
  });

  const activeCt = listings.filter((l) => l.status === "active").length;
  const pendingCt = listings.filter((l) => l.status === "pending").length;
  const soldCt = listings.filter((l) => l.status === "sold").length;

  const tabs: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: "active", label: "Current Asks", count: activeCt, icon: <Tag size={13} /> },
    { key: "pending", label: "Pending", count: pendingCt, icon: <Clock size={13} /> },
    { key: "sold", label: "History", count: soldCt, icon: <CheckCircle2 size={13} /> },
  ];

  const stats = [
    {
      label: "Active Asks",
      value: sellerStats.activeListings.toString(),
      icon: Tag,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/15",
    },
    {
      label: "Pending Sales",
      value: sellerStats.pendingSales.toString(),
      icon: Clock,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      borderColor: "border-amber-400/15",
    },
    {
      label: "Total Sales",
      value: sellerStats.totalSales.toString(),
      icon: Package,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      borderColor: "border-blue-400/15",
    },
    {
      label: "Total Revenue",
      value: formatPrice(sellerStats.totalRevenue),
      icon: DollarSign,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      borderColor: "border-emerald-400/15",
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
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Tag size={15} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Selling</h1>
          </div>
          <p className="text-sm text-muted">Manage your asks, pending sales, and history</p>
        </div>
        <Link
          href="/dashboard/listings/new"
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all w-fit"
        >
          <Plus size={14} />
          New Listing
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
              <p className={`text-2xl font-bold tracking-tight ${stat.label === "Total Revenue" ? "text-emerald-400" : "text-foreground"}`}>
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
            onClick={() => setActiveTab(tab.key)}
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

      {/* Listings Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="bg-card rounded-2xl border border-border overflow-hidden"
      >
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_95px_95px_95px_95px_70px_50px] gap-3 px-5 py-3 border-b border-white/[0.04] bg-white/[0.01]">
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold">Item</span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">Your Ask</span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">Lowest Ask</span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">Highest Bid</span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">Last Sale</span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">Views</span>
          <span />
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/[0.04]">
          <AnimatePresence mode="popLayout">
            {filteredListings.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-16 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                  <Tag size={24} className="text-muted/30" />
                </div>
                <p className="text-foreground font-medium">No {activeTab} listings</p>
                <p className="text-sm text-muted mt-1 mb-4">Your {activeTab} listings will appear here.</p>
                {activeTab === "active" && (
                  <Link
                    href="/dashboard/listings/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors"
                  >
                    <Plus size={14} />
                    Create your first listing
                  </Link>
                )}
              </motion.div>
            ) : (
              filteredListings.map((listing, i) => {
                const config = statusConfig[listing.status] || statusConfig.active;
                const isAboveLowest = listing.lowestAsk && listing.askPrice > listing.lowestAsk;
                const isBelowLowest = listing.lowestAsk && listing.askPrice <= listing.lowestAsk;

                return (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_95px_95px_95px_95px_70px_50px] gap-2 sm:gap-3 items-center px-5 py-4 hover:bg-white/[0.015] transition-colors group relative"
                  >
                    {/* Product */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-muted/30 shrink-0 group-hover:border-border-hover transition-colors">
                        <Package size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {listing.productName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {listing.size && (
                            <span className="text-[11px] text-muted bg-surface px-1.5 py-0.5 rounded">
                              {listing.size}
                            </span>
                          )}
                          <span className="text-[11px] text-muted capitalize">{listing.category}</span>
                          <Badge variant={config.variant}>
                            <span className="flex items-center gap-0.5">
                              {config.icon}
                              {listing.status}
                            </span>
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Ask Price */}
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{formatPrice(listing.askPrice)}</p>
                      {isBelowLowest && (
                        <span className="text-[9px] font-semibold text-emerald-400 flex items-center justify-end gap-0.5 mt-0.5">
                          <TrendingDown size={8} /> Lowest
                        </span>
                      )}
                      <p className="text-[10px] text-muted sm:hidden mt-0.5">Your Ask</p>
                    </div>

                    {/* Lowest Ask */}
                    <div className="text-right hidden sm:block">
                      <p className={`text-sm ${listing.lowestAsk ? "text-foreground/80" : "text-muted/30"}`}>
                        {listing.lowestAsk ? formatPrice(listing.lowestAsk) : "—"}
                      </p>
                    </div>

                    {/* Highest Bid */}
                    <div className="text-right hidden sm:block">
                      <p className={`text-sm ${listing.highestBid ? "text-foreground/80" : "text-muted/30"}`}>
                        {listing.highestBid ? formatPrice(listing.highestBid) : "—"}
                      </p>
                    </div>

                    {/* Last Sale */}
                    <div className="text-right hidden sm:block">
                      <p className={`text-sm ${listing.lastSale ? "text-foreground/80" : "text-muted/30"}`}>
                        {listing.lastSale ? formatPrice(listing.lastSale) : "—"}
                      </p>
                    </div>

                    {/* Views */}
                    <div className="text-right hidden sm:block">
                      <span className="text-sm text-muted flex items-center justify-end gap-1">
                        <Eye size={11} className="text-muted/50" />
                        {listing.views}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="text-right relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === listing.id ? null : listing.id)}
                        className="p-1.5 rounded-lg hover:bg-surface text-muted/50 hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {/* Dropdown menu */}
                      <AnimatePresence>
                        {openMenu === listing.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-xl shadow-xl shadow-black/20 overflow-hidden z-20"
                          >
                            <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                              <Edit3 size={12} className="text-muted" />
                              Edit Ask
                            </button>
                            <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                              <BarChart3 size={12} className="text-muted" />
                              View Analytics
                            </button>
                            <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                              <RefreshCw size={12} className="text-muted" />
                              Relist
                            </button>
                            <div className="border-t border-border" />
                            <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-error hover:bg-red-500/5 transition-colors">
                              <Trash2 size={12} />
                              Remove
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
        {filteredListings.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04] bg-white/[0.01]">
            <p className="text-[11px] text-muted">
              Showing <span className="font-semibold text-foreground">{filteredListings.length}</span> {activeTab} listing{filteredListings.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-4 text-[11px] text-muted">
              <span>
                Total ask value:{" "}
                <span className="font-semibold text-foreground">
                  {formatPrice(filteredListings.reduce((sum, l) => sum + l.askPrice, 0))}
                </span>
              </span>
              <span>
                Total views:{" "}
                <span className="font-semibold text-foreground">
                  {filteredListings.reduce((sum, l) => sum + l.views, 0).toLocaleString()}
                </span>
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
