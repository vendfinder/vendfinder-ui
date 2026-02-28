"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Shield,
  Bell,
  CreditCard,
  MapPin,
  Smartphone,
  Lock,
  Plus,
  Trash2,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Fingerprint,
  Mail,
  Package,
  Tag,
  TrendingDown,
  Gavel,
  Truck,
  Megaphone,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Badge from "@/components/ui/Badge";

type Section = "addresses" | "payment" | "notifications" | "security";

const sections: { key: Section; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bgColor: string; desc: string }[] = [
  { key: "addresses", label: "Shipping", icon: MapPin, color: "text-blue-400", bgColor: "bg-blue-400/10", desc: "Manage addresses" },
  { key: "payment", label: "Payment", icon: CreditCard, color: "text-violet-400", bgColor: "bg-violet-400/10", desc: "Cards & methods" },
  { key: "notifications", label: "Notifications", icon: Bell, color: "text-amber-400", bgColor: "bg-amber-400/10", desc: "Alert preferences" },
  { key: "security", label: "Security", icon: Shield, color: "text-emerald-400", bgColor: "bg-emerald-400/10", desc: "Password & 2FA" },
];

const notificationItems = [
  { label: "Bid Accepted", desc: "When one of your bids is accepted", on: true, icon: Gavel },
  { label: "Ask Matched", desc: "When someone matches your ask price", on: true, icon: Tag },
  { label: "Price Drops", desc: "When favorited items drop in price", on: true, icon: TrendingDown },
  { label: "Outbid Alerts", desc: "When someone outbids you", on: true, icon: AlertTriangle },
  { label: "Shipping Updates", desc: "Tracking and delivery notifications", on: true, icon: Truck },
  { label: "Promotional", desc: "Deals, new releases, and recommendations", on: false, icon: Megaphone },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>("addresses");
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(notificationItems.map((n) => [n.label, n.on]))
  );

  const handleToggle = (label: string) => {
    setToggles((prev) => ({ ...prev, [label]: !prev[label] }));
  };

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
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>
        <p className="text-sm text-muted">Manage your account, security, and preferences</p>
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
                    <p className="text-sm font-semibold text-foreground">Shipping Addresses</p>
                    <p className="text-[11px] text-muted">Manage your delivery locations</p>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-400/10 text-blue-400 text-xs font-semibold hover:bg-blue-400/15 transition-colors">
                  <Plus size={12} />
                  Add New
                </button>
              </div>

              {[
                { name: "Alex Johnson", line1: "123 Main Street, Apt 4B", line2: "New York, NY 10001", isDefault: true },
                { name: "Alex Johnson", line1: "456 Oak Avenue", line2: "Brooklyn, NY 11201", isDefault: false },
              ].map((addr, i) => (
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
                          Default
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
              ))}
            </motion.div>
          )}

          {/* ─── PAYMENT METHODS ─── */}
          {activeSection === "payment" && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-400/10 text-violet-400 flex items-center justify-center">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Payment Methods</p>
                    <p className="text-[11px] text-muted">Cards used for purchasing items</p>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-400/10 text-violet-400 text-xs font-semibold hover:bg-violet-400/15 transition-colors">
                  <Plus size={12} />
                  Add Card
                </button>
              </div>

              {[
                { type: "VISA", color: "bg-blue-600", number: "4242", exp: "08/27", isDefault: true },
                { type: "MC", color: "bg-amber-500", number: "8901", exp: "12/26", isDefault: false },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className={`bg-card rounded-2xl border ${card.isDefault ? "border-violet-400/20" : "border-border"} p-4 flex items-center gap-4 group hover:border-violet-400/30 transition-all`}
                >
                  <div className={`w-12 h-8 ${card.color} rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-lg`}>
                    {card.type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-foreground">
                        {card.type === "VISA" ? "Visa" : "Mastercard"} ending in {card.number}
                      </p>
                      {card.isDefault && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-violet-400/10 text-violet-400">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted">Expires {card.exp}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                    <ChevronRight size={14} className="text-muted/30" />
                  </div>
                </motion.div>
              ))}
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
                  <p className="text-sm font-semibold text-foreground">Notification Preferences</p>
                  <p className="text-[11px] text-muted">Choose which alerts you receive</p>
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
                    <p className="text-sm font-semibold text-foreground">Email Notifications</p>
                    <p className="text-[11px] text-muted">Sent to {user?.email || "your email"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-12">
                  {["Instant", "Daily Digest", "Weekly", "Off"].map((opt) => (
                    <button
                      key={opt}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        opt === "Instant"
                          ? "bg-primary text-white shadow-[0_0_10px_rgba(232,136,58,0.15)]"
                          : "text-muted hover:text-foreground bg-surface hover:bg-surface/80"
                      }`}
                    >
                      {opt}
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
                  <p className="text-sm font-semibold text-foreground">Security</p>
                  <p className="text-[11px] text-muted">Password, two-factor auth, and account safety</p>
                </div>
              </div>

              {/* Change Password */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <KeyRound size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Change Password</p>
                    <p className="text-[11px] text-muted">Use a strong, unique password</p>
                  </div>
                </div>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-3 pl-12">
                  {[
                    { id: "current", label: "Current Password", placeholder: "Enter current password" },
                    { id: "new", label: "New Password", placeholder: "Enter new password" },
                    { id: "confirm", label: "Confirm Password", placeholder: "Confirm new password" },
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
                    Update Password
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
                    <p className="text-sm font-semibold text-foreground">Two-Factor Authentication</p>
                    <p className="text-[11px] text-muted mt-0.5">Add an extra layer of security with an authenticator app</p>
                  </div>
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-emerald-400/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-400/10 transition-all">
                    <Shield size={12} />
                    Enable 2FA
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-4 pl-15 ml-15">
                  <div className="flex items-center gap-6 pl-[60px] text-[11px] text-muted">
                    <span className="flex items-center gap-1.5">
                      <Smartphone size={11} className="text-muted/50" />
                      Authenticator App
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail size={11} className="text-muted/50" />
                      Email Backup
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
                    <p className="text-sm font-semibold text-foreground">Active Sessions</p>
                    <p className="text-[11px] text-muted">Devices currently logged in</p>
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
                          Current
                        </span>
                      ) : (
                        <button className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">
                          Revoke
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
                    <p className="text-sm font-semibold text-red-400">Delete Account</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      Permanently remove your account and all data. This action cannot be undone.
                    </p>
                  </div>
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all border border-red-500/20">
                    <Trash2 size={12} />
                    Delete
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
