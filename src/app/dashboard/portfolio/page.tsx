"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Tag,
  MoreHorizontal,
  ExternalLink,
  BarChart3,
  Trash2,
  Package,
  Percent,
  ArrowUpRight,
  Search,
  ShieldCheck,
} from "lucide-react";
import { portfolio } from "@/data/seller";
import { formatPrice } from "@/lib/utils";

type SortKey = "value" | "gain" | "loss" | "recent";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "value", label: "Highest Value" },
  { key: "gain", label: "Top Gainers" },
  { key: "loss", label: "Top Losers" },
  { key: "recent", label: "Recently Added" },
];

function sortPortfolio(items: typeof portfolio, key: SortKey) {
  const sorted = [...items];
  switch (key) {
    case "value":
      return sorted.sort((a, b) => b.currentValue - a.currentValue);
    case "gain":
      return sorted.sort((a, b) => b.gainLossPercent - a.gainLossPercent);
    case "loss":
      return sorted.sort((a, b) => a.gainLossPercent - b.gainLossPercent);
    default:
      return sorted;
  }
}

function MiniBar({ percent }: { percent: number }) {
  const clamped = Math.min(Math.max(percent, -30), 30);
  const normalized = ((clamped + 30) / 60) * 100;
  const isPositive = percent >= 0;

  return (
    <div className="w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden relative mt-1.5">
      <div className="absolute left-1/2 top-0 w-px h-full bg-white/[0.08]" />
      {isPositive ? (
        <div
          className="absolute top-0 h-full rounded-full bg-emerald-400/60"
          style={{ left: "50%", width: `${(percent / 30) * 50}%` }}
        />
      ) : (
        <div
          className="absolute top-0 h-full rounded-full bg-red-400/60"
          style={{ right: "50%", width: `${(Math.abs(percent) / 30) * 50}%` }}
        />
      )}
    </div>
  );
}

export default function PortfolioPage() {
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const sorted = sortPortfolio(portfolio, sortKey);

  const totalPurchaseValue = portfolio.reduce((sum, p) => sum + p.purchasePrice, 0);
  const totalCurrentValue = portfolio.reduce((sum, p) => sum + p.currentValue, 0);
  const totalGainLoss = totalCurrentValue - totalPurchaseValue;
  const totalGainLossPercent =
    totalPurchaseValue > 0 ? (totalGainLoss / totalPurchaseValue) * 100 : 0;
  const gainers = portfolio.filter((p) => p.gainLoss > 0).length;
  const losers = portfolio.filter((p) => p.gainLoss < 0).length;

  const stats = [
    {
      label: "Portfolio Value",
      value: formatPrice(totalCurrentValue),
      sub: `${portfolio.length} items`,
      icon: Briefcase,
      color: "text-violet-400",
      bgColor: "bg-violet-400/10",
      borderColor: "border-violet-400/15",
      valueColor: "text-violet-400",
    },
    {
      label: "Total Cost",
      value: formatPrice(totalPurchaseValue),
      sub: "purchase basis",
      icon: DollarSign,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      borderColor: "border-blue-400/15",
      valueColor: "text-foreground",
    },
    {
      label: "Total Gain/Loss",
      value: `${totalGainLoss >= 0 ? "+" : ""}${formatPrice(Math.abs(totalGainLoss))}`,
      sub: `${totalGainLossPercent >= 0 ? "+" : ""}${totalGainLossPercent.toFixed(1)}% all time`,
      icon: TrendingUp,
      color: totalGainLoss >= 0 ? "text-emerald-400" : "text-red-400",
      bgColor: totalGainLoss >= 0 ? "bg-emerald-400/10" : "bg-red-400/10",
      borderColor: totalGainLoss >= 0 ? "border-emerald-400/15" : "border-red-400/15",
      valueColor: totalGainLoss >= 0 ? "text-emerald-400" : "text-red-400",
    },
    {
      label: "ROI",
      value: `${totalGainLossPercent >= 0 ? "+" : ""}${totalGainLossPercent.toFixed(1)}%`,
      sub: `${gainers} up · ${losers} down`,
      icon: Percent,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      borderColor: "border-amber-400/15",
      valueColor: totalGainLossPercent >= 0 ? "text-emerald-400" : "text-red-400",
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
            <div className="w-8 h-8 rounded-xl bg-violet-400/10 flex items-center justify-center">
              <Briefcase size={15} className="text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
          </div>
          <p className="text-sm text-muted">Track the value of items in your collection</p>
        </div>
        <Link
          href="/dashboard/listings/new"
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all w-fit"
        >
          <Tag size={14} />
          List an Item
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
              <p className={`text-2xl font-bold tracking-tight ${stat.valueColor}`}>
                {stat.value}
              </p>
              <p className="text-[11px] text-muted mt-1">{stat.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Sort bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex gap-1 mb-6 p-1 bg-surface/60 rounded-xl border border-border/60 w-fit backdrop-blur-sm"
      >
        {sortOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => setSortKey(option.key)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              sortKey === option.key
                ? "bg-primary text-white shadow-[0_0_15px_rgba(232,136,58,0.15)]"
                : "text-muted hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="bg-card rounded-2xl border border-border overflow-hidden"
      >
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_95px_95px_100px_100px_50px] gap-3 px-5 py-3 border-b border-white/[0.04] bg-white/[0.01]">
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold">Item</span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">Cost Basis</span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">Market Value</span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">Gain / Loss</span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">Return</span>
          <span />
        </div>

        <div className="divide-y divide-white/[0.04]">
          <AnimatePresence mode="popLayout">
            {sorted.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-16 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                  <Briefcase size={24} className="text-muted/30" />
                </div>
                <p className="text-foreground font-medium">No items in portfolio</p>
                <p className="text-sm text-muted mt-1 mb-4">Purchase items to start tracking your collection value.</p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-400/10 text-violet-400 text-sm font-medium hover:bg-violet-400/15 transition-colors"
                >
                  <Search size={14} />
                  Browse Products
                </Link>
              </motion.div>
            ) : (
              sorted.map((item, i) => {
                const isUp = item.gainLoss >= 0;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_95px_95px_100px_100px_50px] gap-2 sm:gap-3 items-center px-5 py-4 hover:bg-white/[0.015] transition-colors group relative"
                  >
                    {/* Product */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-muted/30 shrink-0 group-hover:border-border-hover transition-colors relative">
                        <Package size={18} />
                        {/* Condition dot */}
                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                          item.condition.toLowerCase().includes("new") || item.condition.toLowerCase().includes("deadstock") || item.condition.toLowerCase().includes("sealed") || item.condition.toLowerCase().includes("mint")
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}>
                          <ShieldCheck size={8} className="text-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {item.productName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {item.size && (
                            <span className="text-[11px] text-muted bg-surface px-1.5 py-0.5 rounded">
                              {item.size}
                            </span>
                          )}
                          <span className="text-[11px] text-muted">{item.condition}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cost Basis */}
                    <div className="text-right">
                      <p className="text-sm text-foreground/80">{formatPrice(item.purchasePrice)}</p>
                      <p className="text-[9px] text-muted mt-0.5">{item.purchaseDate}</p>
                    </div>

                    {/* Market Value */}
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-foreground">{formatPrice(item.currentValue)}</p>
                    </div>

                    {/* Gain/Loss $ */}
                    <div className="text-right hidden sm:block">
                      <p className={`text-sm font-semibold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                        {isUp ? "+" : "-"}{formatPrice(Math.abs(item.gainLoss))}
                      </p>
                      <MiniBar percent={item.gainLossPercent} />
                    </div>

                    {/* Return % */}
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold ${
                        isUp
                          ? "bg-emerald-400/[0.08] text-emerald-400"
                          : "bg-red-400/[0.08] text-red-400"
                      }`}>
                        {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {isUp ? "+" : ""}{item.gainLossPercent}%
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="text-right relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)}
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
                              <Tag size={12} className="text-muted" />
                              Sell Now
                            </button>
                            <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                              <ExternalLink size={12} className="text-muted" />
                              View Product
                            </button>
                            <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                              <BarChart3 size={12} className="text-muted" />
                              Price History
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
        {sorted.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04] bg-white/[0.01]">
            <p className="text-[11px] text-muted">
              <span className="font-semibold text-foreground">{sorted.length}</span> item{sorted.length !== 1 ? "s" : ""} in collection
            </p>
            <div className="flex items-center gap-4 text-[11px] text-muted">
              <span>
                <span className="font-semibold text-emerald-400">{gainers}</span> up
              </span>
              <span className="w-px h-3 bg-white/[0.06]" />
              <span>
                <span className="font-semibold text-red-400">{losers}</span> down
              </span>
              <span className="w-px h-3 bg-white/[0.06]" />
              <span>
                Net:{" "}
                <span className={`font-semibold ${totalGainLoss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {totalGainLoss >= 0 ? "+" : "-"}{formatPrice(Math.abs(totalGainLoss))}
                </span>
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
