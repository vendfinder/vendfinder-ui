"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  MapPin,
  Calendar,
  Star,
  Clock,
  Package,
  Eye,
  Tag,
  Heart,
  Briefcase,
  Instagram,
  Globe,
  Users,
  UserPlus,
  UserCheck,
  Shield,
  TrendingUp,
  TrendingDown,
  Share2,
  Edit3,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  favorites,
  portfolio,
  sellerStats,
  getActiveListings,
} from "@/data/seller";
import { formatPrice } from "@/lib/utils";

type ProfileTab = "selling" | "feedback" | "favorites" | "collection";

const feedbackItems = [
  { id: 1, buyer: "SneakerHead99", rating: 5, comment: "Fast shipper! Item exactly as described. Would buy again.", date: "2024-11-01", item: "Air Jordan 4 Retro Bred" },
  { id: 2, buyer: "TechBuyerNYC", rating: 5, comment: "Great seller, perfect packaging. A+", date: "2024-10-15", item: "Apple AirPods Pro 2" },
  { id: 3, buyer: "StreetStyleKing", rating: 4, comment: "Good condition, took an extra day to ship but solid overall.", date: "2024-09-28", item: "Carhartt WIP Detroit Jacket" },
  { id: 4, buyer: "CollectorJoe", rating: 5, comment: "Legit seller. Item was sealed and authentic. Highly recommend.", date: "2024-09-10", item: "New Balance 550 White Green" },
  { id: 5, buyer: "FreshKicksOnly", rating: 5, comment: "Shipped same day, excellent communication throughout.", date: "2024-08-20", item: "Nike Dunk Low Panda" },
];

export default function PublicProfilePage() {
  const params = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("selling");
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = user?.username === params.username;
  const activeListings = getActiveListings();

  const tabs: { key: ProfileTab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: "selling", label: "Selling", count: activeListings.length, icon: <Tag size={13} /> },
    { key: "feedback", label: "Feedback", count: feedbackItems.length, icon: <Star size={13} /> },
    { key: "favorites", label: "Favorites", count: favorites.length, icon: <Heart size={13} /> },
    { key: "collection", label: "Collection", count: portfolio.length, icon: <Briefcase size={13} /> },
  ];

  const totalCollectionValue = portfolio.reduce((sum, p) => sum + p.currentValue, 0);

  return (
    <div className="min-h-screen">
      {/* ─── BANNER ─── */}
      <div className="relative h-44 sm:h-56 overflow-hidden">
        {/* Gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f05] via-[#0f0b15] to-[#0a0d18]" />
        {/* Radial orbs */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(232,136,58,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(139,92,246,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_80%,rgba(59,130,246,0.08),transparent_50%)]" />
        {/* Diagonal lines */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 24px, white 24px, white 25px)",
        }} />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        {/* Noise overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        }} />
      </div>

      {/* ─── PROFILE HEADER ─── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 sm:-mt-24 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-6">
            {/* Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative shrink-0"
            >
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-card border-4 border-background shadow-2xl shadow-black/30 flex items-center justify-center text-primary font-bold text-4xl sm:text-5xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/25 to-violet-500/10" />
                <span className="relative">{user?.name?.charAt(0) || "A"}</span>
              </div>
              {user?.verified && (
                <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-primary rounded-xl flex items-center justify-center border-[3px] border-background shadow-lg shadow-primary/20">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
              )}
              {/* Level badge */}
              <div className="absolute -top-2 -right-2 w-9 h-9 bg-card border-2 border-primary/60 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-primary font-black text-xs">Lv{user?.sellerLevel || 1}</span>
              </div>
            </motion.div>

            {/* Name & Meta */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex-1 min-w-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                      {user?.name || "User"}
                    </h1>
                    {user?.verified && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                        Verified Seller
                      </span>
                    )}
                  </div>
                  <p className="text-muted text-sm mt-0.5">@{user?.username || params.username}</p>
                  {user?.bio && (
                    <p className="text-foreground/70 text-sm mt-2.5 max-w-md leading-relaxed">{user.bio}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-[12px] text-muted">
                    {user?.location && (
                      <span className="flex items-center gap-1 bg-surface px-2.5 py-1 rounded-lg">
                        <MapPin size={11} className="text-muted/50" />
                        {user.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1 bg-surface px-2.5 py-1 rounded-lg">
                      <Calendar size={11} className="text-muted/50" />
                      Joined 2024
                    </span>
                    {user?.socialLinks?.instagram && (
                      <a href="#" className="flex items-center gap-1 bg-surface px-2.5 py-1 rounded-lg hover:text-pink-400 transition-colors">
                        <Instagram size={11} />
                        {user.socialLinks.instagram}
                      </a>
                    )}
                    {user?.socialLinks?.website && (
                      <a href="#" className="flex items-center gap-1 bg-surface px-2.5 py-1 rounded-lg hover:text-blue-400 transition-colors">
                        <Globe size={11} />
                        Website
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isOwnProfile ? (
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all bg-surface/40 backdrop-blur-sm"
                    >
                      <Edit3 size={13} />
                      Edit Profile
                    </Link>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsFollowing(!isFollowing)}
                        className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          isFollowing
                            ? "border border-border/60 text-foreground hover:border-red-400/40 hover:text-red-400 bg-surface/40"
                            : "bg-primary text-white shadow-[0_0_20px_rgba(232,136,58,0.2)] hover:shadow-[0_0_30px_rgba(232,136,58,0.3)]"
                        }`}
                      >
                        {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                      <button className="p-2.5 rounded-xl border border-border/60 hover:bg-surface text-muted hover:text-foreground transition-all">
                        <Share2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ─── STATS ROW ─── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8"
        >
          {[
            { label: "Followers", value: user?.followers?.toLocaleString() || "0", icon: Users, color: "text-blue-400", bgColor: "bg-blue-400/10", borderColor: "border-blue-400/15" },
            { label: "Following", value: (user?.following || 0).toString(), icon: UserPlus, color: "text-violet-400", bgColor: "bg-violet-400/10", borderColor: "border-violet-400/15" },
            { label: "Total Sales", value: sellerStats.totalSales.toString(), icon: Package, color: "text-emerald-400", bgColor: "bg-emerald-400/10", borderColor: "border-emerald-400/15" },
            { label: "Rating", value: sellerStats.sellerRating.toString(), icon: Star, color: "text-amber-400", bgColor: "bg-amber-400/10", borderColor: "border-amber-400/15", isStar: true },
            { label: "Avg Ship", value: sellerStats.avgShipTime, icon: Clock, color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-primary/15" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 + i * 0.05 }}
                className={`bg-card rounded-2xl border ${stat.borderColor} p-4 ${stat.label === "Avg Ship" ? "hidden sm:block" : ""}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-lg ${stat.bgColor} ${stat.color} flex items-center justify-center`}>
                    <Icon size={13} className={stat.isStar ? "fill-amber-400" : ""} />
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground tracking-tight">{stat.value}</p>
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mt-0.5">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ─── SELLER LEVEL BAR ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="bg-card rounded-2xl border border-primary/15 p-5 mb-8 relative overflow-hidden"
        >
          {/* Subtle gradient bg */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.04] to-transparent pointer-events-none" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Shield size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Seller Level {user?.sellerLevel || 1}</p>
                <div className="flex gap-1 mt-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-2 rounded-full transition-all ${
                        i <= (user?.sellerLevel || 1)
                          ? "w-10 bg-primary shadow-[0_0_8px_rgba(232,136,58,0.3)]"
                          : "w-10 bg-white/[0.06]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-[12px]">
              <span className="flex items-center gap-1.5 text-muted">
                <Clock size={12} className="text-muted/50" />
                <span className="font-semibold text-foreground">{sellerStats.avgShipTime}</span> avg ship
              </span>
              <span className="w-px h-4 bg-white/[0.06]" />
              <span className="flex items-center gap-1.5 text-muted">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span className="font-semibold text-foreground">{sellerStats.completionRate}%</span> completion
              </span>
              <span className="w-px h-4 bg-white/[0.06]" />
              <span className="flex items-center gap-1.5 text-muted">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="font-semibold text-foreground">{sellerStats.sellerRating}</span> rating
              </span>
            </div>
          </div>
        </motion.div>

        {/* ─── TABS ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex gap-1 mb-8 p-1 bg-surface/60 rounded-xl border border-border/60 w-fit backdrop-blur-sm"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
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

        {/* ─── TAB CONTENT ─── */}
        <div className="pb-12">
          <AnimatePresence mode="wait">
            {/* SELLING TAB */}
            {activeTab === "selling" && (
              <motion.div
                key="selling"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {activeListings.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-border py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                      <Tag size={24} className="text-muted/30" />
                    </div>
                    <p className="text-foreground font-medium">No active listings</p>
                    <p className="text-sm text-muted mt-1">This seller has no items for sale right now.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeListings.map((listing, i) => (
                      <motion.div
                        key={listing.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="bg-card rounded-2xl border border-border overflow-hidden group cursor-pointer hover:border-border-hover transition-all"
                      >
                        {/* Image placeholder */}
                        <div className="aspect-square bg-surface relative flex items-center justify-center text-muted/20 overflow-hidden">
                          <Package size={48} />
                          {/* Condition badge */}
                          <div className="absolute top-3 right-3">
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-white border border-white/10">
                              {listing.condition === "new" ? "New" : "Used"}
                            </span>
                          </div>
                          {/* Views */}
                          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-white/70 text-[10px]">
                            <Eye size={10} />
                            {listing.views}
                          </div>
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-primary/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        <div className="p-4">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {listing.productName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {listing.size && (
                              <span className="text-[11px] text-muted bg-surface px-1.5 py-0.5 rounded">
                                {listing.size}
                              </span>
                            )}
                            <span className="text-[11px] text-muted capitalize">{listing.category}</span>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
                            <div>
                              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Ask</p>
                              <p className="text-lg font-bold text-primary">{formatPrice(listing.askPrice)}</p>
                            </div>
                            {listing.lastSale && (
                              <div className="text-right">
                                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Last Sale</p>
                                <p className="text-sm font-semibold text-foreground/70">{formatPrice(listing.lastSale)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* FEEDBACK TAB */}
            {activeTab === "feedback" && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Rating Summary */}
                <div className="bg-card rounded-2xl border border-amber-400/15 p-6">
                  <div className="flex items-center gap-8 flex-wrap">
                    <div className="text-center">
                      <div className="flex items-center gap-1.5 justify-center mb-1">
                        <Star size={24} className="text-amber-400 fill-amber-400" />
                        <span className="text-4xl font-bold text-foreground">{sellerStats.sellerRating}</span>
                      </div>
                      <p className="text-[11px] text-muted">{feedbackItems.length} reviews</p>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = feedbackItems.filter((f) => f.rating === stars).length;
                        const pct = (count / feedbackItems.length) * 100;
                        return (
                          <div key={stars} className="flex items-center gap-2.5 mb-1.5">
                            <span className="text-[11px] text-muted w-3 text-right">{stars}</span>
                            <Star size={9} className="text-amber-400 fill-amber-400 shrink-0" />
                            <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, delay: 0.1 + (5 - stars) * 0.08 }}
                                className="h-full bg-amber-400/70 rounded-full"
                              />
                            </div>
                            <span className="text-[11px] text-muted w-5 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Reviews */}
                <div className="space-y-3">
                  {feedbackItems.map((review, i) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="bg-card rounded-2xl border border-border p-5 hover:border-border-hover transition-all"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-foreground text-xs font-bold shrink-0">
                          {review.buyer.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1">
                            <p className="text-sm font-semibold text-foreground">{review.buyer}</p>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={10}
                                  className={s <= review.rating ? "text-amber-400 fill-amber-400" : "text-white/[0.06]"}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-foreground/70 leading-relaxed">{review.comment}</p>
                          <div className="flex items-center gap-2 mt-2.5 text-[11px] text-muted">
                            <span className="bg-surface px-2 py-0.5 rounded">{review.item}</span>
                            <span className="text-muted/40">&middot;</span>
                            <span>{review.date}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* FAVORITES TAB */}
            {activeTab === "favorites" && (
              <motion.div
                key="favorites"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {favorites.map((item, i) => {
                  const isUp = item.priceChange >= 0;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="bg-card rounded-2xl border border-border overflow-hidden group cursor-pointer hover:border-border-hover transition-all"
                    >
                      <div className="aspect-[4/3] bg-surface relative flex items-center justify-center text-muted/20">
                        <Heart size={36} />
                        <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-rose-500/80 backdrop-blur-sm flex items-center justify-center">
                          <Heart size={12} className="text-white fill-white" />
                        </div>
                        {/* Price change badge */}
                        <div className="absolute bottom-3 left-3">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-sm border ${
                            isUp
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/20"
                              : "bg-red-500/20 text-red-300 border-red-400/20"
                          }`}>
                            {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                            {isUp ? "+" : ""}{item.priceChange}%
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-muted capitalize mt-0.5">{item.category.replace("-", " ")}</p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
                          <div>
                            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Lowest Ask</p>
                            <p className="text-sm font-bold text-emerald-400">{formatPrice(item.lowestAsk)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Last Sale</p>
                            <p className="text-sm font-semibold text-foreground/70">{formatPrice(item.lastSale)}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* COLLECTION TAB */}
            {activeTab === "collection" && (
              <motion.div
                key="collection"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Collection summary */}
                <div className="bg-card rounded-2xl border border-violet-400/15 p-5 mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-400/[0.04] to-transparent pointer-events-none" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-violet-400/10 text-violet-400 flex items-center justify-center">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Collection Value</p>
                        <p className="text-2xl font-bold text-foreground tracking-tight">
                          {formatPrice(totalCollectionValue)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Items</p>
                      <p className="text-2xl font-bold text-foreground">{portfolio.length}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portfolio.map((item, i) => {
                    const isUp = item.gainLoss >= 0;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="bg-card rounded-2xl border border-border overflow-hidden group cursor-pointer hover:border-border-hover transition-all"
                      >
                        <div className="aspect-square bg-surface relative flex items-center justify-center text-muted/20">
                          <Briefcase size={40} />
                          {/* Gain/loss badge */}
                          <div className="absolute top-3 right-3">
                            <span className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-sm border ${
                              isUp
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/20"
                                : "bg-red-500/20 text-red-300 border-red-400/20"
                            }`}>
                              {isUp ? "+" : ""}{item.gainLossPercent}%
                            </span>
                          </div>
                          {/* Condition */}
                          <div className="absolute bottom-3 left-3">
                            <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-white/70 border border-white/10">
                              {item.condition}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {item.productName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {item.size && (
                              <span className="text-[11px] text-muted bg-surface px-1.5 py-0.5 rounded">
                                {item.size}
                              </span>
                            )}
                            <span className="text-[11px] text-muted capitalize">{item.category}</span>
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
                            <div>
                              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Value</p>
                              <p className="text-sm font-bold text-foreground">{formatPrice(item.currentValue)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Gain/Loss</p>
                              <p className={`text-sm font-bold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                                {isUp ? "+" : "-"}{formatPrice(Math.abs(item.gainLoss))}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
