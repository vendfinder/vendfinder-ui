"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  MoreHorizontal,
  Eye,
  ExternalLink,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useDashboardData } from "@/hooks/useDashboardData";
import Badge from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";

type Tab = "all" | "processing" | "shipped" | "delivered";

const statusConfig: Record<string, { variant: "info" | "warning" | "success" | "error"; icon: React.ReactNode; color: string; bgColor: string }> = {
  processing: { variant: "info", icon: <Clock size={10} />, color: "text-blue-400", bgColor: "bg-blue-400" },
  shipped: { variant: "warning", icon: <Truck size={10} />, color: "text-amber-400", bgColor: "bg-amber-400" },
  delivered: { variant: "success", icon: <CheckCircle2 size={10} />, color: "text-emerald-400", bgColor: "bg-emerald-400" },
  cancelled: { variant: "error", icon: <XCircle size={10} />, color: "text-red-400", bgColor: "bg-red-400" },
};

export default function OrdersPage() {
  const t = useTranslations("dashboardOrders");
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { orders, loading } = useDashboardData();

  const filteredOrders = activeTab === "all"
    ? orders
    : orders.filter((o) => o.status === activeTab);

  const processingCt = orders.filter((o) => o.status === "processing").length;
  const shippedCt = orders.filter((o) => o.status === "shipped").length;
  const deliveredCt = orders.filter((o) => o.status === "delivered").length;

  const tabs: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: "all", label: t("allOrders"), count: orders.length, icon: <ShoppingBag size={13} /> },
    { key: "processing", label: t("processing"), count: processingCt, icon: <Clock size={13} /> },
    { key: "shipped", label: t("shipped"), count: shippedCt, icon: <Truck size={13} /> },
    { key: "delivered", label: t("delivered"), count: deliveredCt, icon: <CheckCircle2 size={13} /> },
  ];

  const stats = [
    { label: t("allOrders"), value: orders.length.toString(), icon: ShoppingBag, color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-primary/15" },
    { label: t("processing"), value: processingCt.toString(), icon: Clock, color: "text-blue-400", bgColor: "bg-blue-400/10", borderColor: "border-blue-400/15" },
    { label: t("shipped"), value: shippedCt.toString(), icon: Truck, color: "text-amber-400", bgColor: "bg-amber-400/10", borderColor: "border-amber-400/15" },
    { label: t("delivered"), value: deliveredCt.toString(), icon: CheckCircle2, color: "text-emerald-400", bgColor: "bg-emerald-400/10", borderColor: "border-emerald-400/15" },
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
              <ShoppingBag size={15} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          </div>
          <p className="text-sm text-muted">{t("subtitle")}</p>
        </div>
        <button className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all bg-surface/40 backdrop-blur-sm w-fit">
          <Search size={14} />
          {t("searchOrders")}
        </button>
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
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-primary text-white shadow-[0_0_15px_rgba(232,136,58,0.15)]"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              activeTab === tab.key ? "bg-white/20 text-white" : "bg-surface text-muted/70"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Orders List */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="bg-card rounded-2xl border border-border overflow-hidden"
      >
        <div className="divide-y divide-white/[0.04]">
          <AnimatePresence mode="popLayout">
            {filteredOrders.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-16 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                  <Package size={24} className="text-muted/30" />
                </div>
                <p className="text-foreground font-medium">{t("noOrdersFound")}</p>
                <p className="text-sm text-muted mt-1">{t("ordersWillAppear")}</p>
              </motion.div>
            ) : (
              filteredOrders.map((order, i) => {
                const config = statusConfig[order.status] || statusConfig.processing;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="flex items-center gap-4 px-5 py-5 hover:bg-white/[0.015] transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-muted/30 shrink-0 group-hover:border-border-hover transition-colors relative">
                      <Package size={18} />
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${config.bgColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {order.id}
                        </p>
                        <Badge variant={config.variant}>
                          <span className="flex items-center gap-1">
                            {config.icon}
                            {order.status}
                          </span>
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted">
                        {order.items.map((item, j) => (
                          <span key={j}>
                            {j > 0 && " · "}
                            {item.productName} x{item.quantity}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted">
                        <span>{order.date}</span>
                        {order.trackingNumber && (
                          <>
                            <span className="text-muted/30">&middot;</span>
                            <span className="font-mono bg-surface px-1.5 py-0.5 rounded text-[10px]">
                              {order.trackingNumber}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <p className="text-sm font-bold text-foreground">{formatPrice(order.total)}</p>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === order.id ? null : order.id)}
                          className="p-1.5 rounded-lg hover:bg-surface text-muted/50 hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        <AnimatePresence>
                          {openMenu === order.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-xl shadow-xl shadow-black/20 overflow-hidden z-20"
                            >
                              <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                                <Eye size={12} className="text-muted" />
                                {t("viewDetails")}
                              </button>
                              <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                                <ExternalLink size={12} className="text-muted" />
                                {t("trackPackage")}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {filteredOrders.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04] bg-white/[0.01]">
            <p className="text-[11px] text-muted">
              {t("ordersCount", { count: filteredOrders.length })}
            </p>
            <span className="text-[11px] text-muted">
              {t("totalValue")}{" "}
              <span className="font-semibold text-foreground">
                {formatPrice(filteredOrders.reduce((sum, o) => sum + o.total, 0))}
              </span>
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
