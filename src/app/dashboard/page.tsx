"use client";

import { motion } from "framer-motion";
import {
  DollarSign,
  Package,
  TrendingUp,
  Tag,
  ShoppingBag,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Star,
  CheckCircle2,
  Eye,
  Zap,
  Plus,
  ChevronRight,
  BarChart3,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { sellerStats, listings, purchases } from "@/data/seller";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

const quickStats = [
  {
    label: "Total Revenue",
    value: formatPrice(sellerStats.totalRevenue),
    icon: DollarSign,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-400/20",
    glowColor: "shadow-[0_0_25px_rgba(52,211,153,0.06)]",
    change: "+12.5%",
    up: true,
    sparkline: [30, 45, 35, 55, 48, 60, 72],
  },
  {
    label: "Active Listings",
    value: sellerStats.activeListings.toString(),
    icon: Tag,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
    glowColor: "shadow-[0_0_25px_rgba(232,136,58,0.06)]",
    change: "+3",
    up: true,
    sparkline: [8, 6, 9, 7, 10, 9, 12],
  },
  {
    label: "Total Sales",
    value: sellerStats.totalSales.toString(),
    icon: Package,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/20",
    glowColor: "shadow-[0_0_25px_rgba(96,165,250,0.06)]",
    change: "+8",
    up: true,
    sparkline: [100, 110, 105, 120, 130, 125, 147],
  },
  {
    label: "Portfolio Value",
    value: formatPrice(sellerStats.portfolioValue),
    icon: Briefcase,
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
    borderColor: "border-violet-400/20",
    glowColor: "shadow-[0_0_25px_rgba(167,139,250,0.06)]",
    change: "+5.2%",
    up: true,
    sparkline: [80, 85, 78, 92, 88, 95, 100],
  },
];

const statusVariant: Record<string, "info" | "warning" | "success" | "error"> = {
  active: "info",
  pending: "warning",
  sold: "success",
  pending_shipment: "warning",
  shipped: "info",
  delivered: "success",
  authenticated: "success",
  cancelled: "error",
};

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 28;
  const w = 80;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");

  const colorMap: Record<string, string> = {
    "text-emerald-400": "#34d399",
    "text-primary": "#E8883A",
    "text-blue-400": "#60a5fa",
    "text-violet-400": "#a78bfa",
  };

  return (
    <svg width={w} height={h} className="opacity-40">
      <polyline
        points={points}
        fill="none"
        stroke={colorMap[color] || "#E8883A"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const recentListings = listings.filter((l) => l.status === "active").slice(0, 4);
  const recentPurchases = purchases.slice(0, 4);

  return (
    <div>
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl overflow-hidden mb-8 p-6 sm:p-8"
      >
        {/* Banner background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f05] via-card to-[#0f0b15]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(232,136,58,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_20%,rgba(139,92,246,0.06),transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 40px,
              rgba(232,136,58,0.5) 40px,
              rgba(232,136,58,0.5) 41px
            )`,
          }}
        />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary font-bold text-lg shadow-[0_0_20px_rgba(232,136,58,0.15)]">
                {user?.name?.charAt(0) || "?"}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  Welcome back, {user?.name?.split(" ")[0]}
                </h1>
                <p className="text-sm text-muted">
                  Here&apos;s your activity at a glance
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${user?.username || "me"}`}
              className="px-4 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-muted hover:text-foreground hover:border-border-hover transition-all bg-background/40 backdrop-blur-sm"
            >
              View Profile
            </Link>
            <Link
              href="/dashboard/listings/new"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all"
            >
              <Plus size={14} />
              New Listing
            </Link>
          </div>
        </div>

        {/* Seller stats ribbon */}
        <div className="relative flex flex-wrap items-center gap-x-6 gap-y-2 mt-5 pt-5 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <Zap size={13} className="text-primary" />
            </div>
            <span className="text-xs text-muted">Level</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`w-5 h-1 rounded-full transition-colors ${
                    i <= (user?.sellerLevel || 1) ? "bg-primary" : "bg-white/[0.06]"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="w-px h-4 bg-white/[0.06] hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className="text-sm font-bold text-foreground">{sellerStats.sellerRating}</span>
            <span className="text-xs text-muted">rating</span>
          </div>
          <div className="w-px h-4 bg-white/[0.06] hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-muted" />
            <span className="text-sm font-bold text-foreground">{sellerStats.avgShipTime}</span>
            <span className="text-xs text-muted">avg ship</span>
          </div>
          <div className="w-px h-4 bg-white/[0.06] hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-success" />
            <span className="text-sm font-bold text-foreground">{sellerStats.completionRate}%</span>
            <span className="text-xs text-muted">completion</span>
          </div>
          <div className="w-px h-4 bg-white/[0.06] hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <Eye size={12} className="text-muted" />
            <span className="text-sm font-bold text-foreground">{user?.profileViews?.toLocaleString()}</span>
            <span className="text-xs text-muted">profile views</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.07 }}
              className={`bg-card rounded-2xl border ${stat.borderColor} p-5 ${stat.glowColor} hover:scale-[1.02] transition-transform cursor-default`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-10 h-10 rounded-xl ${stat.bgColor} ${stat.color} flex items-center justify-center`}
                >
                  <Icon size={18} />
                </div>
                <MiniSparkline data={stat.sparkline} color={stat.color} />
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted">{stat.label}</p>
                <span
                  className={`flex items-center gap-0.5 text-[11px] font-bold ${
                    stat.up ? "text-emerald-400" : "text-error"
                  }`}
                >
                  {stat.up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                  {stat.change}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Active Listings & Recent Purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Active Listings */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Tag size={13} className="text-primary" />
              </div>
              <h2 className="text-base font-bold text-foreground">Active Listings</h2>
            </div>
            <Link
              href="/dashboard/selling"
              className="flex items-center gap-1 text-xs font-medium text-muted hover:text-primary transition-colors"
            >
              View All
              <ChevronRight size={12} />
            </Link>
          </div>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="divide-y divide-white/[0.04]">
              {recentListings.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + i * 0.06 }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.015] transition-colors group"
                >
                  <div className="w-11 h-11 rounded-xl bg-surface border border-border flex items-center justify-center text-muted/40 shrink-0 group-hover:border-border-hover transition-colors">
                    <Package size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {listing.productName}
                    </p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {listing.size && `${listing.size} · `}
                      <span className="capitalize">{listing.category}</span>
                      {" · "}
                      <span className="inline-flex items-center gap-0.5">
                        <Eye size={9} />
                        {listing.views}
                      </span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">
                      {formatPrice(listing.askPrice)}
                    </p>
                    {listing.lastSale && (
                      <p className="text-[10px] text-muted mt-0.5">
                        Last {formatPrice(listing.lastSale)}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            <Link
              href="/dashboard/selling"
              className="block text-center py-3 text-xs font-medium text-muted hover:text-primary border-t border-white/[0.04] hover:bg-white/[0.01] transition-colors"
            >
              See all {listings.filter((l) => l.status === "active").length} listings
            </Link>
          </div>
        </motion.div>

        {/* Recent Purchases */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-400/10 flex items-center justify-center">
                <ShoppingBag size={13} className="text-blue-400" />
              </div>
              <h2 className="text-base font-bold text-foreground">Recent Purchases</h2>
            </div>
            <Link
              href="/dashboard/buying"
              className="flex items-center gap-1 text-xs font-medium text-muted hover:text-primary transition-colors"
            >
              View All
              <ChevronRight size={12} />
            </Link>
          </div>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="divide-y divide-white/[0.04]">
              {recentPurchases.map((purchase, i) => (
                <motion.div
                  key={purchase.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.55 + i * 0.06 }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.015] transition-colors group"
                >
                  <div className="w-11 h-11 rounded-xl bg-surface border border-border flex items-center justify-center text-muted/40 shrink-0 group-hover:border-border-hover transition-colors">
                    <ShoppingBag size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {purchase.productName}
                    </p>
                    <p className="text-[11px] text-muted mt-0.5">
                      from {purchase.sellerName} · {purchase.date}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground mb-1">
                      {formatPrice(purchase.price)}
                    </p>
                    <Badge variant={statusVariant[purchase.status] || "default"}>
                      {purchase.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
            <Link
              href="/dashboard/buying"
              className="block text-center py-3 text-xs font-medium text-muted hover:text-primary border-t border-white/[0.04] hover:bg-white/[0.01] transition-colors"
            >
              See all purchases
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { href: "/dashboard/selling", icon: Tag, label: "Manage Listings", color: "text-primary", bg: "bg-primary/[0.06] hover:bg-primary/10 border-primary/10" },
          { href: "/dashboard/buying", icon: ShoppingBag, label: "Purchases", color: "text-blue-400", bg: "bg-blue-400/[0.06] hover:bg-blue-400/10 border-blue-400/10" },
          { href: "/dashboard/portfolio", icon: TrendingUp, label: "Portfolio", color: "text-violet-400", bg: "bg-violet-400/[0.06] hover:bg-violet-400/10 border-violet-400/10" },
          { href: "/dashboard/payouts", icon: DollarSign, label: "Payouts", color: "text-emerald-400", bg: "bg-emerald-400/[0.06] hover:bg-emerald-400/10 border-emerald-400/10" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${action.bg} group`}
          >
            <div className={`w-9 h-9 rounded-lg bg-white/[0.03] flex items-center justify-center ${action.color} group-hover:scale-105 transition-transform`}>
              <action.icon size={16} />
            </div>
            <span className="text-sm font-medium text-foreground">{action.label}</span>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
