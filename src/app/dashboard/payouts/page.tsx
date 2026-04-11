"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ArrowUpRight,
  MoreHorizontal,
  Download,
  Eye,
  Receipt,
  Package,
  Banknote,
  MessageCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useDashboardData } from "@/hooks/useDashboardData";
import Badge from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import PayoutMethodsManager from "@/components/dashboard/PayoutMethodsManager";
import SellerGate from "@/components/dashboard/SellerGate";
import KYCBanner from "@/components/dashboard/KYCBanner";

type Tab = "all" | "completed" | "pending";

const statusVariant: Record<string, "info" | "warning" | "success" | "error"> = {
  pending: "warning",
  processing: "info",
  completed: "success",
  failed: "error",
};

const statusIcon: Record<string, React.ReactNode> = {
  pending: <Clock size={10} />,
  processing: <ArrowUpRight size={10} />,
  completed: <CheckCircle2 size={10} />,
  failed: <AlertCircle size={10} />,
};

export default function PayoutsPage() {
  const t = useTranslations("dashboardPayouts");
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { payouts, sellerStats, loading } = useDashboardData();

  const completedPayouts = payouts.filter((p) => p.status === "completed");
  const pendingPayouts = payouts.filter((p) => ["pending", "processing"].includes(p.status));

  const filteredPayouts =
    activeTab === "completed"
      ? completedPayouts
      : activeTab === "pending"
        ? pendingPayouts
        : payouts;

  const totalPaidOut = completedPayouts.reduce((sum, p) => sum + p.net, 0);
  const pendingAmount = pendingPayouts.reduce((sum, p) => sum + p.net, 0);
  const totalFees = payouts.reduce((sum, p) => sum + p.fee, 0);

  const tabs: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: "all", label: t("all"), count: payouts.length, icon: <Banknote size={13} /> },
    { key: "completed", label: t("completed"), count: completedPayouts.length, icon: <CheckCircle2 size={13} /> },
    { key: "pending", label: t("pending"), count: pendingPayouts.length, icon: <Clock size={13} /> },
  ];

  const stats = [
    {
      label: t("totalPaidOut"),
      value: formatPrice(totalPaidOut),
      icon: DollarSign,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      borderColor: "border-emerald-400/15",
      valueColor: "text-emerald-400",
    },
    {
      label: t("pendingPayouts"),
      value: formatPrice(pendingAmount),
      icon: Clock,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      borderColor: "border-amber-400/15",
      valueColor: "text-foreground",
    },
    {
      label: t("totalRevenue"),
      value: formatPrice(sellerStats.totalRevenue),
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/15",
      valueColor: "text-foreground",
    },
    {
      label: t("totalFees"),
      value: formatPrice(totalFees),
      sub: "9% seller fee",
      icon: Receipt,
      color: "text-red-400",
      bgColor: "bg-red-400/10",
      borderColor: "border-red-400/15",
      valueColor: "text-red-400",
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
            <div className="w-8 h-8 rounded-xl bg-emerald-400/10 flex items-center justify-center">
              <Wallet size={15} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          </div>
          <p className="text-sm text-muted">{t("subtitle")}</p>
        </div>
        <button className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:border-emerald-400/40 hover:text-emerald-400 transition-all bg-surface/40 backdrop-blur-sm w-fit">
          <Download size={14} />
          {t("exportCsv")}
        </button>
      </motion.div>

      {/* KYC Banner */}
      <KYCBanner />

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
            </motion.div>
          );
        })}
      </div>

      {/* Payout Methods */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="mb-8"
      >
        <PayoutMethodsManager variant="standard" />
      </motion.div>

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

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="bg-card rounded-2xl border border-border overflow-hidden"
      >
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_90px_75px_90px_95px_90px_50px] gap-3 px-5 py-3 border-b border-white/[0.04] bg-white/[0.01]">
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold">{t("items")}</span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">{t("gross")}</span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">{t("fee")}</span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">{t("net")}</span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">{t("method")}</span>
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold text-right">{t("status")}</span>
          <span />
        </div>

        <div className="divide-y divide-white/[0.04]">
          <AnimatePresence mode="popLayout">
            {filteredPayouts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-16 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                  <Wallet size={24} className="text-muted/30" />
                </div>
                <p className="text-foreground font-medium">{t("noPayoutsYet")}</p>
                <p className="text-sm text-muted mt-1">{t("payoutHistoryWillAppear")}</p>
              </motion.div>
            ) : (
              filteredPayouts.map((payout, i) => {
                const feePercent = ((payout.fee / payout.amount) * 100).toFixed(0);

                return (
                  <motion.div
                    key={payout.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_90px_75px_90px_95px_90px_50px] gap-2 sm:gap-3 items-center px-5 py-4 hover:bg-white/[0.015] transition-colors group relative"
                  >
                    {/* Items */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-muted/30 shrink-0 group-hover:border-border-hover transition-colors relative">
                        <Package size={18} />
                        <div className="absolute -bottom-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-primary/80 flex items-center justify-center px-1">
                          <span className="text-[8px] font-bold text-white">{payout.items.length}</span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {payout.items.length === 1
                            ? payout.items[0]
                            : `${payout.items[0]} +${payout.items.length - 1} more`}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-muted">{payout.date}</span>
                          <span className="text-[11px] text-muted/40">·</span>
                          <span className="text-[10px] text-muted font-mono">{payout.id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Gross */}
                    <div className="text-right">
                      <p className="text-sm text-foreground/80">{formatPrice(payout.amount)}</p>
                    </div>

                    {/* Fee */}
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-red-400/80">-{formatPrice(payout.fee)}</p>
                      <span className="text-[9px] text-muted">{feePercent}%</span>
                    </div>

                    {/* Net */}
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-emerald-400">{formatPrice(payout.net)}</p>
                    </div>

                    {/* Method */}
                    <div className="text-right hidden sm:block">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                        {payout.method === "paypal" ? (
                          <CreditCard size={10} className="text-blue-400" />
                        ) : payout.method === "alipay" ? (
                          <Wallet size={10} className="text-sky-400" />
                        ) : payout.method === "wechat" ? (
                          <MessageCircle size={10} className="text-green-400" />
                        ) : (
                          <Wallet size={10} className="text-muted" />
                        )}
                        {payout.method === "paypal" ? "PayPal" : payout.method === "alipay" ? "Alipay" : payout.method === "wechat" ? "WeChat" : payout.method}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="text-right">
                      <Badge variant={statusVariant[payout.status]}>
                        <span className="flex items-center gap-1">
                          {statusIcon[payout.status]}
                          {payout.status}
                        </span>
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="text-right relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === payout.id ? null : payout.id)}
                        className="p-1.5 rounded-lg hover:bg-surface text-muted/50 hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      <AnimatePresence>
                        {openMenu === payout.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-xl shadow-black/20 overflow-hidden z-20"
                          >
                            <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                              <Eye size={12} className="text-muted" />
                              {t("viewDetails")}
                            </button>
                            <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                              <Receipt size={12} className="text-muted" />
                              {t("downloadReceipt")}
                            </button>
                            <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition-colors">
                              <AlertCircle size={12} className="text-muted" />
                              {t("reportIssue")}
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
        {filteredPayouts.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04] bg-white/[0.01]">
            <p className="text-[11px] text-muted">
              {t("payoutsCount", { count: filteredPayouts.length })}
            </p>
            <div className="flex items-center gap-4 text-[11px] text-muted">
              <span>
                {t("gross")}:{" "}
                <span className="font-semibold text-foreground">
                  {formatPrice(filteredPayouts.reduce((sum, p) => sum + p.amount, 0))}
                </span>
              </span>
              <span className="w-px h-3 bg-white/[0.06]" />
              <span>
                {t("totalFees")}:{" "}
                <span className="font-semibold text-red-400">
                  -{formatPrice(filteredPayouts.reduce((sum, p) => sum + p.fee, 0))}
                </span>
              </span>
              <span className="w-px h-3 bg-white/[0.06]" />
              <span>
                {t("net")}:{" "}
                <span className="font-semibold text-emerald-400">
                  {formatPrice(filteredPayouts.reduce((sum, p) => sum + p.net, 0))}
                </span>
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
    </SellerGate>
  );
}
