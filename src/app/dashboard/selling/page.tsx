"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
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
  Loader2,
  X,
  ShoppingBag,
  Truck,
  XCircle,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/context/AuthContext";
import { updateAsk, deleteAsk } from "@/lib/api-products";
import { shipOrder } from "@/lib/api-orders";
import Badge from "@/components/ui/Badge";
import { formatPrice, getTrackingUrl, formatCarrierName } from "@/lib/utils";
import SellerGate from "@/components/dashboard/SellerGate";
import FeatureListingModal from "@/components/dashboard/FeatureListingModal";
import SponsorListingModal from "@/components/dashboard/SponsorListingModal";
import { Sparkles } from "lucide-react";
import { confirmFeaturedSlot, confirmSponsoredSlot } from "@/lib/api-products";
import type { SaleOrder } from "@/types";

type Tab = "active" | "orders" | "pending" | "sold";

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
  const t = useTranslations("dashboardSelling");
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editingAsk, setEditingAsk] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [featuringListing, setFeaturingListing] = useState<{ productId: string; productName: string } | null>(null);
  const [sponsoringListing, setSponsoringListing] = useState<{ productId: string; productName: string; category: string } | null>(null);
  const [shippingOrder, setShippingOrder] = useState<SaleOrder | null>(null);
  const [shipCarrier, setShipCarrier] = useState("usps");
  const [shipTracking, setShipTracking] = useState("");
  const [shipping, setShipping] = useState(false);
  const { token } = useAuth();
  const { sellerStats, listings, sellerOrders, loading, refetch } = useDashboardData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [featureConfirmed, setFeatureConfirmed] = useState(false);

  // Handle return from Stripe featured checkout
  useEffect(() => {
    if (!token) return;
    const activated = searchParams.get("featured_activated");
    const sessionId = searchParams.get("session_id");
    if (activated === "true" && sessionId) {
      confirmFeaturedSlot(sessionId, token)
        .then(() => {
          setFeatureConfirmed(true);
          router.replace("/dashboard/selling", { scroll: false });
          setTimeout(() => setFeatureConfirmed(false), 5000);
        })
        .catch(() => {
          router.replace("/dashboard/selling", { scroll: false });
        });
    }
    const sponsored = searchParams.get("sponsored_activated");
    if (sponsored === "true" && sessionId) {
      confirmSponsoredSlot(sessionId, token)
        .then(() => router.replace("/dashboard/selling", { scroll: false }))
        .catch(() => router.replace("/dashboard/selling", { scroll: false }));
    }
  }, [searchParams, token, router]);

  const saleOrderStatusConfig: Record<
    string,
    { variant: "info" | "warning" | "success" | "error"; icon: React.ReactNode; label: string; bgColor: string }
  > = {
    processing: { variant: "info", icon: <Clock size={10} />, label: t("statusNeedsShipping"), bgColor: "bg-blue-400" },
    shipped: { variant: "warning", icon: <Truck size={10} />, label: t("statusShipped"), bgColor: "bg-amber-400" },
    delivered: { variant: "success", icon: <CheckCircle2 size={10} />, label: t("statusDelivered"), bgColor: "bg-emerald-400" },
    completed: { variant: "success", icon: <CheckCircle2 size={10} />, label: t("statusCompleted"), bgColor: "bg-emerald-400" },
    cancelled: { variant: "error", icon: <XCircle size={10} />, label: t("statusCancelled"), bgColor: "bg-red-400" },
  };

  const handleEditAsk = (listingId: string, currentPrice: number) => {
    setEditingAsk(listingId);
    setEditPrice(currentPrice.toString());
    setOpenMenu(null);
  };

  const handleSaveAsk = async (askId: string) => {
    if (!token || saving) return;
    const price = parseFloat(editPrice);
    if (!price || price <= 0) return;
    setSaving(true);
    try {
      await updateAsk(askId, { ask_price: price }, token);
      setEditingAsk(null);
      refetch();
    } catch {
      // keep editing open on error
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAsk = async (askId: string) => {
    if (!token || deleting) return;
    setDeleting(askId);
    setOpenMenu(null);
    try {
      await deleteAsk(askId, token);
      refetch();
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  const handleOpenShipModal = (sale: SaleOrder) => {
    setShippingOrder(sale);
    setShipCarrier("usps");
    setShipTracking("");
    setOpenMenu(null);
  };

  const handleShipOrder = async () => {
    if (!token || !shippingOrder || shipping) return;
    if (!shipTracking.trim()) return;
    setShipping(true);
    try {
      await shipOrder(shippingOrder.id, {
        trackingNumber: shipTracking.trim(),
        carrier: shipCarrier,
      }, token);
      setShippingOrder(null);
      refetch();
    } catch {
      // stay open on error
    } finally {
      setShipping(false);
    }
  };

  const carriers = [
    { value: "usps", label: "USPS" },
    { value: "ups", label: "UPS" },
    { value: "fedex", label: "FedEx" },
    { value: "dhl", label: "DHL" },
    { value: "china_post", label: "China Post / EMS" },
    { value: "sf_express", label: "SF Express" },
    { value: "yunexpress", label: "YunExpress" },
    { value: "4px", label: "4PX" },
    { value: "yanwen", label: "Yanwen" },
    { value: "other", label: t("carrierOther") },
  ];

  const filteredListings = listings.filter((l) => {
    if (activeTab === "active") return l.status === "active";
    if (activeTab === "pending") return l.status === "pending";
    if (activeTab === "sold") return l.status === "sold";
    return true;
  });

  const activeCt = listings.filter((l) => l.status === "active").length;
  const pendingCt = listings.filter((l) => l.status === "pending").length;
  const soldCt = listings.filter((l) => l.status === "sold").length;

  const activeSellerOrders = sellerOrders.filter((o) => !["cancelled", "refunded", "pending_payment"].includes(o.status));

  const tabs: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: "active", label: t("currentAsks"), count: activeCt, icon: <Tag size={13} /> },
    { key: "orders", label: t("orders"), count: activeSellerOrders.length, icon: <ShoppingBag size={13} /> },
    { key: "pending", label: t("pending"), count: pendingCt, icon: <Clock size={13} /> },
    { key: "sold", label: t("history"), count: soldCt, icon: <CheckCircle2 size={13} /> },
  ];

  const stats = [
    {
      label: t("activeAsks"),
      value: sellerStats.activeListings.toString(),
      icon: Tag,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/15",
    },
    {
      label: t("pendingSales"),
      value: sellerStats.pendingSales.toString(),
      icon: Clock,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      borderColor: "border-amber-400/15",
    },
    {
      label: t("totalSales"),
      value: sellerStats.totalSales.toString(),
      icon: Package,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      borderColor: "border-blue-400/15",
    },
    {
      label: t("totalRevenue"),
      value: formatPrice(sellerStats.totalRevenue),
      icon: DollarSign,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      borderColor: "border-emerald-400/15",
    },
  ];

  return (
    <SellerGate backHref="/dashboard">
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
            <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          </div>
          <p className="text-sm text-muted">{t("subtitle")}</p>
        </div>
        <Link
          href="/dashboard/listings/new"
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all w-fit"
        >
          <Plus size={14} />
          {t("newListing")}
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
              <p className={`text-2xl font-bold tracking-tight ${stat.label === t("totalRevenue") ? "text-emerald-400" : "text-foreground"}`}>
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

      {/* Seller Orders */}
      {activeTab === "orders" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_100px_100px_100px_50px] gap-3 px-5 py-3 border-b border-white/[0.04] bg-white/[0.01]">
            <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold">{t("headerProduct")}</span>
            <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">{t("headerSalePrice")}</span>
            <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">{t("headerYourPayout")}</span>
            <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">{t("headerStatus")}</span>
            <span />
          </div>

          <div className="divide-y divide-white/[0.04]">
            {activeSellerOrders.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag size={24} className="text-muted/30" />
                </div>
                <p className="text-foreground font-medium">{t("noSalesYet")}</p>
                <p className="text-sm text-muted mt-1 mb-4">{t("noSalesDescription")}</p>
                <Link
                  href="/dashboard/listings/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors"
                >
                  <Plus size={14} />
                  {t("createListing")}
                </Link>
              </div>
            ) : (
              activeSellerOrders.map((sale, i) => {
                const config = saleOrderStatusConfig[sale.status] || saleOrderStatusConfig.processing;
                return (
                  <motion.div
                    key={sale.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_100px_50px] gap-2 sm:gap-3 items-center px-5 py-4 hover:bg-white/[0.015] transition-colors group"
                  >
                    {/* Product info */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-muted/30 shrink-0 group-hover:border-border-hover transition-colors relative">
                        <Package size={18} />
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${config.bgColor}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {sale.product_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {sale.size && (
                            <span className="text-[11px] text-muted bg-surface px-1.5 py-0.5 rounded">
                              {sale.size}
                            </span>
                          )}
                          <span className="text-[11px] text-muted">
                            {sale.order_number} &middot; {new Date(sale.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {sale.status === "processing" && sale.shipping_name && (
                          <p className="text-[10px] text-muted mt-1 truncate">
                            {t("shipTo")}: <span className="text-foreground/70">{sale.shipping_name}, {sale.shipping_city}, {sale.shipping_state}</span>
                          </p>
                        )}
                        {sale.tracking_number && (
                          <p className="text-[10px] font-mono text-primary/80 bg-primary/[0.05] px-1.5 py-0.5 rounded-md w-fit mt-1">
                            {sale.carrier?.toUpperCase()} {sale.tracking_number}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Sale Price */}
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{formatPrice(parseFloat(String(sale.item_price)))}</p>
                    </div>

                    {/* Seller Payout */}
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-400">{formatPrice(parseFloat(String(sale.seller_payout)))}</p>
                      <span className="text-[9px] text-muted block mt-0.5">
                        -{formatPrice(parseFloat(String(sale.platform_fee)))} {t("fee")}
                      </span>
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
                        onClick={() => setOpenMenu(openMenu === sale.id ? null : sale.id)}
                        className="p-1.5 rounded-lg hover:bg-surface text-muted/50 hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      <AnimatePresence>
                        {openMenu === sale.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-xl shadow-black/20 overflow-hidden z-20"
                          >
                            {sale.status === "processing" && (
                              <button
                                onClick={() => handleOpenShipModal(sale)}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                              >
                                <Truck size={12} className="text-muted" />
                                {t("shipOrder")}
                              </button>
                            )}
                            <button
                              onClick={() => { handleOpenShipModal(sale); }}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                            >
                              <Eye size={12} className="text-muted" />
                              {t("viewDetails")}
                            </button>
                            <Link
                              href={`/dashboard/messages?seller=${sale.buyer_id}`}
                              onClick={() => setOpenMenu(null)}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                            >
                              <MessageCircle size={12} className="text-muted" />
                              {t("messageBuyer")}
                            </Link>
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
          {activeSellerOrders.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04] bg-white/[0.01]">
              <p className="text-[11px] text-muted">
                <span className="font-semibold text-foreground">{activeSellerOrders.length}</span> {activeSellerOrders.length !== 1 ? t("salesPlural") : t("saleSingular")}
              </p>
              <span className="text-[11px] text-muted">
                {t("totalPayout")}:{" "}
                <span className="font-semibold text-emerald-400">
                  {formatPrice(activeSellerOrders.reduce((sum, s) => sum + parseFloat(String(s.seller_payout)), 0))}
                </span>
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Listings Table */}
      {/* Ship Order Modal */}
      <AnimatePresence>
        {shippingOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !shipping && setShippingOrder(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {shippingOrder.status === "processing" ? t("shipOrder") : t("orderDetails")}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">{shippingOrder.order_number}</p>
                </div>
                <button onClick={() => !shipping && setShippingOrder(null)} className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-surface transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Product info */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-surface border border-border flex items-center justify-center text-muted/30 shrink-0">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{shippingOrder.product_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {shippingOrder.size && (
                        <span className="text-[11px] text-muted bg-surface px-1.5 py-0.5 rounded">{shippingOrder.size}</span>
                      )}
                      <span className="text-[11px] text-muted">{formatPrice(parseFloat(String(shippingOrder.item_price)))}</span>
                    </div>
                  </div>
                </div>

                {/* Buyer shipping address */}
                {shippingOrder.shipping_name && (
                  <div className="bg-surface/60 rounded-xl border border-border/60 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-blue-400/10 flex items-center justify-center">
                        <Truck size={12} className="text-blue-400" />
                      </div>
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider">{t("shipTo")}</span>
                    </div>
                    <div className="text-sm text-foreground space-y-0.5">
                      <p className="font-medium">{shippingOrder.shipping_name}</p>
                      <p className="text-muted">{shippingOrder.shipping_address_line1}</p>
                      {shippingOrder.shipping_address_line2 && (
                        <p className="text-muted">{shippingOrder.shipping_address_line2}</p>
                      )}
                      <p className="text-muted">
                        {shippingOrder.shipping_city}, {shippingOrder.shipping_state} {shippingOrder.shipping_zip}
                      </p>
                      {shippingOrder.shipping_country && shippingOrder.shipping_country !== "US" && (
                        <p className="text-muted">{shippingOrder.shipping_country}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Shipping form (only for processing orders) */}
                {shippingOrder.status === "processing" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">{t("carrier")}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {carriers.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => setShipCarrier(c.value)}
                            className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                              shipCarrier === c.value
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-surface text-muted hover:text-foreground hover:border-border-hover"
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">{t("trackingNumber")}</label>
                      <input
                        type="text"
                        value={shipTracking}
                        onChange={(e) => setShipTracking(e.target.value)}
                        placeholder={t("enterTrackingNumber")}
                        className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Already shipped info */}
                {shippingOrder.tracking_number && shippingOrder.status !== "processing" && (
                  <div className="bg-surface/60 rounded-xl border border-border/60 p-4">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">{t("tracking")}</span>
                    {(() => {
                      const url = getTrackingUrl(shippingOrder.carrier, shippingOrder.tracking_number);
                      const label = `${formatCarrierName(shippingOrder.carrier)} · ${shippingOrder.tracking_number}`;
                      return url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-mono text-primary hover:underline inline-flex items-center gap-1.5 mt-2"
                        >
                          {label}
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <p className="text-sm font-mono text-primary mt-2">{label}</p>
                      );
                    })()}
                    {shippingOrder.shipped_at && (
                      <p className="text-[11px] text-muted mt-1">
                        {t("shippedOn", { date: new Date(shippingOrder.shipped_at).toLocaleDateString() })}
                      </p>
                    )}
                  </div>
                )}

                {/* Message Buyer */}
                <Link
                  href={`/dashboard/messages?seller=${shippingOrder.buyer_id}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all"
                >
                  <MessageCircle size={14} />
                  {t("messageBuyer")}
                </Link>
              </div>

              {/* Footer */}
              {shippingOrder.status === "processing" && (
                <div className="px-6 py-4 border-t border-border flex items-center gap-3">
                  <button
                    onClick={() => setShippingOrder(null)}
                    disabled={shipping}
                    className="flex-1 px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted hover:text-foreground hover:border-border-hover transition-all"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={handleShipOrder}
                    disabled={shipping || !shipTracking.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {shipping ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Truck size={14} />
                    )}
                    {shipping ? t("shippingProgress") : t("markAsShipped")}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab !== "orders" && <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="bg-card rounded-2xl border border-border"
      >
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_95px_95px_95px_95px_70px_50px] gap-3 px-5 py-3 border-b border-white/[0.04] bg-white/[0.01]">
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold">{t("headerItem")}</span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">{t("headerYourAsk")}</span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">{t("headerLowestAsk")}</span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">{t("headerHighestBid")}</span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">{t("headerLastSale")}</span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">{t("headerViews")}</span>
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
                <p className="text-foreground font-medium">{t("noListings", { tab: activeTab })}</p>
                <p className="text-sm text-muted mt-1 mb-4">{t("noListingsDescription", { tab: activeTab })}</p>
                {activeTab === "active" && (
                  <Link
                    href="/dashboard/listings/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors"
                  >
                    <Plus size={14} />
                    {t("createFirstListing")}
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
                      <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-muted/30 shrink-0 group-hover:border-border-hover transition-colors overflow-hidden relative">
                        {listing.productImage ? (
                          <Image
                            src={listing.productImage}
                            alt={listing.productName}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <Package size={18} />
                        )}
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
                      {editingAsk === listing.id ? (
                        <div className="flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveAsk(listing.id);
                              if (e.key === "Escape") setEditingAsk(null);
                            }}
                            className="w-20 px-2 py-1 text-xs font-bold text-foreground bg-surface border border-primary/40 rounded-lg text-right focus:outline-none focus:border-primary"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveAsk(listing.id)}
                            disabled={saving}
                            className="p-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                          >
                            {saving ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                          </button>
                          <button
                            onClick={() => setEditingAsk(null)}
                            className="p-1 rounded-md bg-surface text-muted hover:text-foreground transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-foreground">{formatPrice(listing.askPrice)}</p>
                          {isBelowLowest && (
                            <span className="text-[9px] font-semibold text-emerald-400 flex items-center justify-end gap-0.5 mt-0.5">
                              <TrendingDown size={8} /> {t("lowest")}
                            </span>
                          )}
                          <p className="text-[10px] text-muted sm:hidden mt-0.5">{t("headerYourAsk")}</p>
                        </>
                      )}
                    </div>

                    {/* Lowest Ask */}
                    <div className="text-right hidden sm:block">
                      <p className={`text-sm ${listing.lowestAsk ? "text-foreground/80" : "text-muted/30"}`}>
                        {listing.lowestAsk ? formatPrice(listing.lowestAsk) : "\u2014"}
                      </p>
                    </div>

                    {/* Highest Bid */}
                    <div className="text-right hidden sm:block">
                      <p className={`text-sm ${listing.highestBid ? "text-foreground/80" : "text-muted/30"}`}>
                        {listing.highestBid ? formatPrice(listing.highestBid) : "\u2014"}
                      </p>
                    </div>

                    {/* Last Sale */}
                    <div className="text-right hidden sm:block">
                      <p className={`text-sm ${listing.lastSale ? "text-foreground/80" : "text-muted/30"}`}>
                        {listing.lastSale ? formatPrice(listing.lastSale) : "\u2014"}
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
                            className="absolute right-0 bottom-full mb-1 w-40 bg-card border border-border rounded-xl shadow-xl shadow-black/20 overflow-hidden z-20"
                          >
                            <button
                              onClick={() => handleEditAsk(listing.id, listing.askPrice)}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                            >
                              <Edit3 size={12} className="text-muted" />
                              {t("editAsk")}
                            </button>
                            <Link
                              href={`/products/${listing.productId}`}
                              onClick={() => setOpenMenu(null)}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                            >
                              <BarChart3 size={12} className="text-muted" />
                              {t("viewProduct")}
                            </Link>
                            <button
                              onClick={() => {
                                setFeaturingListing({ productId: listing.productId, productName: listing.productName });
                                setOpenMenu(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
                            >
                              <Sparkles size={12} />
                              Feature on Homepage
                            </button>
                            <button
                              onClick={() => {
                                setSponsoringListing({ productId: listing.productId, productName: listing.productName, category: listing.category });
                                setOpenMenu(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-amber-400 hover:bg-amber-400/5 transition-colors"
                            >
                              <TrendingUp size={12} />
                              Sponsor in Search
                            </button>
                            <div className="border-t border-border" />
                            <button
                              onClick={() => handleDeleteAsk(listing.id)}
                              disabled={deleting === listing.id}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-error hover:bg-red-500/5 transition-colors disabled:opacity-50"
                            >
                              {deleting === listing.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                              {t("remove")}
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
              {t("showing")} <span className="font-semibold text-foreground">{filteredListings.length}</span> {activeTab} {filteredListings.length !== 1 ? t("listingsPlural") : t("listingSingular")}
            </p>
            <div className="flex items-center gap-4 text-[11px] text-muted">
              <span>
                {t("totalAskValue")}:{" "}
                <span className="font-semibold text-foreground">
                  {formatPrice(filteredListings.reduce((sum, l) => sum + l.askPrice, 0))}
                </span>
              </span>
              <span>
                {t("totalViews")}:{" "}
                <span className="font-semibold text-foreground">
                  {filteredListings.reduce((sum, l) => sum + l.views, 0).toLocaleString()}
                </span>
              </span>
            </div>
          </div>
        )}
      </motion.div>}
      {featuringListing && (
        <FeatureListingModal
          productId={featuringListing.productId}
          productName={featuringListing.productName}
          onClose={() => setFeaturingListing(null)}
        />
      )}
      {sponsoringListing && (
        <SponsorListingModal
          productId={sponsoringListing.productId}
          productName={sponsoringListing.productName}
          productCategory={sponsoringListing.category}
          onClose={() => setSponsoringListing(null)}
        />
      )}
    </div>
    </SellerGate>
  );
}
