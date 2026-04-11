"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Shield,
  Bell,
  Wallet,
  MapPin,
  Smartphone,
  Lock,
  Plus,
  Trash2,
  ChevronRight,
  AlertTriangle,
  KeyRound,
  Fingerprint,
  Mail,
  Tag,
  TrendingDown,
  Gavel,
  Truck,
  Megaphone,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import PayoutMethodsManager from "@/components/dashboard/PayoutMethodsManager";

type Section = "addresses" | "payout-methods" | "notifications" | "security";

interface Address {
  id: string;
  name: string;
  line1: string;
  line2: string;
  isDefault: boolean;
}

export default function SettingsPage() {
  const { user, token } = useAuth();
  const t = useTranslations("dashboardSettings");
  const [activeSection, setActiveSection] = useState<Section>("addresses");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const sections: { key: Section; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bgColor: string; desc: string }[] = [
    { key: "addresses", label: t("tabShipping"), icon: MapPin, color: "text-blue-400", bgColor: "bg-blue-400/10", desc: t("tabShippingDesc") },
    { key: "payout-methods", label: t("tabPayoutMethods"), icon: Wallet, color: "text-emerald-400", bgColor: "bg-emerald-400/10", desc: t("tabPayoutMethodsDesc") },
    { key: "notifications", label: t("tabNotifications"), icon: Bell, color: "text-amber-400", bgColor: "bg-amber-400/10", desc: t("tabNotificationsDesc") },
    { key: "security", label: t("tabSecurity"), icon: Shield, color: "text-emerald-400", bgColor: "bg-emerald-400/10", desc: t("tabSecurityDesc") },
  ];

  const notificationItems = [
    { label: t("notifBidAccepted"), desc: t("notifBidAcceptedDesc"), on: true, icon: Gavel },
    { label: t("notifAskMatched"), desc: t("notifAskMatchedDesc"), on: true, icon: Tag },
    { label: t("notifPriceDrops"), desc: t("notifPriceDropsDesc"), on: true, icon: TrendingDown },
    { label: t("notifOutbidAlerts"), desc: t("notifOutbidAlertsDesc"), on: true, icon: AlertTriangle },
    { label: t("notifShippingUpdates"), desc: t("notifShippingUpdatesDesc"), on: true, icon: Truck },
    { label: t("notifPromotional"), desc: t("notifPromotionalDesc"), on: false, icon: Megaphone },
  ];

  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(notificationItems.map((n) => [n.label, n.on]))
  );

  const handleToggle = (label: string) => {
    setToggles((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Load user addresses
  useEffect(() => {
    const loadAddresses = async () => {
      if (!token) return;

      setLoadingAddresses(true);
      try {
        const response = await fetch('/api/users/me/addresses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAddresses(data);
        }
      } catch (error) {
        console.error('Failed to load addresses:', error);
      } finally {
        setLoadingAddresses(false);
      }
    };

    loadAddresses();
  }, [token]);

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings size={15} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        </div>
        <p className="text-sm text-muted">{t("subtitle")}</p>
      </motion.div>

      {/* Section tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex gap-1 mb-8 p-1 bg-surface/60 rounded-xl border border-border/60 w-fit backdrop-blur-sm"
      >
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeSection === s.key
                  ? "bg-primary text-white shadow-[0_0_15px_rgba(232,136,58,0.15)]"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Icon size={13} />
              {s.label}
            </button>
          );
        })}
      </motion.div>

      {/* Content */}
      <div className="max-w-2xl">
        <AnimatePresence mode="wait">
          {/* ─── SHIPPING ADDRESSES ─── */}
          {activeSection === "addresses" && (
            <motion.div
              key="addresses"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-400/10 text-blue-400 flex items-center justify-center">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t("shippingAddresses")}</p>
                    <p className="text-[11px] text-muted">{t("manageDeliveryLocations")}</p>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-400/10 text-blue-400 text-xs font-semibold hover:bg-blue-400/15 transition-colors">
                  <Plus size={12} />
                  {t("addNew")}
                </button>
              </div>

              {loadingAddresses ? (
                <div className="bg-card rounded-2xl border border-border p-6 text-center">
                  <div className="animate-pulse">
                    <div className="h-4 bg-surface rounded w-1/3 mx-auto mb-2"></div>
                    <div className="h-3 bg-surface rounded w-1/2 mx-auto"></div>
                  </div>
                </div>
              ) : addresses.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-6 text-center">
                  <MapPin className="mx-auto text-muted mb-3" size={32} />
                  <p className="text-sm font-medium text-foreground mb-1">No addresses added yet</p>
                  <p className="text-xs text-muted">Add your first shipping address to get started</p>
                </div>
              ) : (
                addresses.map((addr, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className={`bg-card rounded-2xl border ${addr.isDefault ? "border-blue-400/20" : "border-border"} p-4 flex items-start gap-4 group hover:border-blue-400/30 transition-all`}
                >
                  <div className={`w-10 h-10 rounded-xl ${addr.isDefault ? "bg-blue-400/10 text-blue-400" : "bg-surface text-muted"} flex items-center justify-center shrink-0`}>
                    <MapPin size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground">{addr.name}</p>
                      {addr.isDefault && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-400/10 text-blue-400">
                          {t("default")}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-muted">{addr.line1}</p>
                    <p className="text-[12px] text-muted">{addr.line2}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                    <ChevronRight size={14} className="text-muted/30" />
                  </div>
                </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ─── PAYOUT METHODS ─── */}
          {activeSection === "payout-methods" && (
            <motion.div
              key="payout-methods"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <PayoutMethodsManager variant="compact" />
            </motion.div>
          )}

          {/* ─── NOTIFICATIONS ─── */}
          {activeSection === "notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
                  <Bell size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("notificationPreferences")}</p>
                  <p className="text-[11px] text-muted">{t("chooseAlerts")}</p>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-white/[0.04]">
                {notificationItems.map((item, i) => {
                  const Icon = item.icon;
                  const isOn = toggles[item.label];
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.015] transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-xl ${isOn ? "bg-amber-400/10 text-amber-400" : "bg-surface text-muted/40"} flex items-center justify-center shrink-0 transition-colors`}>
                        <Icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isOn ? "text-foreground" : "text-muted"} transition-colors`}>{item.label}</p>
                        <p className="text-[11px] text-muted">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => handleToggle(item.label)}
                        className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${
                          isOn ? "bg-primary shadow-[0_0_10px_rgba(232,136,58,0.2)]" : "bg-white/[0.06]"
                        }`}
                      >
                        <motion.span
                          layout
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className={`absolute top-0.5 w-5 h-5 rounded-full shadow-sm ${isOn ? "bg-white" : "bg-white/40"}`}
                          style={{ left: isOn ? "22px" : "2px" }}
                        />
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Email preferences */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-400/10 text-blue-400 flex items-center justify-center shrink-0">
                    <Mail size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t("emailNotifications")}</p>
                    <p className="text-[11px] text-muted">{t("sentTo", { email: user?.email || t("yourEmail") })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-12">
                  {[
                    { key: "instant", label: t("emailInstant") },
                    { key: "daily", label: t("emailDailyDigest") },
                    { key: "weekly", label: t("emailWeekly") },
                    { key: "off", label: t("emailOff") },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        opt.key === "instant"
                          ? "bg-primary text-white shadow-[0_0_10px_rgba(232,136,58,0.15)]"
                          : "text-muted hover:text-foreground bg-surface hover:bg-surface/80"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── SECURITY ─── */}
          {activeSection === "security" && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center">
                  <Shield size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("securityTitle")}</p>
                  <p className="text-[11px] text-muted">{t("securitySubtitle")}</p>
                </div>
              </div>

              {/* Change Password */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <KeyRound size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t("changePassword")}</p>
                    <p className="text-[11px] text-muted">{t("useStrongPassword")}</p>
                  </div>
                </div>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-3 pl-12">
                  {[
                    { id: "current", label: t("currentPassword"), placeholder: t("enterCurrentPassword") },
                    { id: "new", label: t("newPassword"), placeholder: t("enterNewPassword") },
                    { id: "confirm", label: t("confirmPassword"), placeholder: t("confirmNewPassword") },
                  ].map((field) => (
                    <div key={field.id}>
                      <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                        {field.label}
                      </label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
                        <input
                          type="password"
                          placeholder={field.placeholder}
                          className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all"
                  >
                    {t("updatePassword")}
                  </button>
                </form>
              </div>

              {/* Two-Factor Auth */}
              <div className="bg-card rounded-2xl border border-emerald-400/15 p-5">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Fingerprint size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{t("twoFactorAuth")}</p>
                    <p className="text-[11px] text-muted mt-0.5">{t("twoFactorAuthDesc")}</p>
                  </div>
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-emerald-400/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-400/10 transition-all">
                    <Shield size={12} />
                    {t("enable2FA")}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-4 pl-15 ml-15">
                  <div className="flex items-center gap-6 pl-[60px] text-[11px] text-muted">
                    <span className="flex items-center gap-1.5">
                      <Smartphone size={11} className="text-muted/50" />
                      {t("authenticatorApp")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail size={11} className="text-muted/50" />
                      {t("emailBackup")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-400/10 text-blue-400 flex items-center justify-center shrink-0">
                    <Smartphone size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t("activeSessions")}</p>
                    <p className="text-[11px] text-muted">{t("devicesLoggedIn")}</p>
                  </div>
                </div>
                <div className="space-y-3 pl-12">
                  {[
                    { device: "MacBook Pro — Chrome", location: "New York, NY", current: true },
                    { device: "iPhone 15 — Safari", location: "New York, NY", current: false },
                  ].map((session, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-xl ${session.current ? "bg-emerald-400/[0.04] border border-emerald-400/10" : "bg-surface border border-border"}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-foreground">{session.device}</p>
                        <p className="text-[11px] text-muted">{session.location}</p>
                      </div>
                      {session.current ? (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400">
                          {t("current")}
                        </span>
                      ) : (
                        <button className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">
                          {t("revoke")}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-card rounded-2xl border border-red-500/20 p-5">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-red-400/10 text-red-400 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-400">{t("deleteAccount")}</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {t("deleteAccountDesc")}
                    </p>
                  </div>
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all border border-red-500/20">
                    <Trash2 size={12} />
                    {t("delete")}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
