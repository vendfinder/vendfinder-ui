"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  AlertTriangle,
  CreditCard,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

interface SellerStatus {
  role: string;
  canList: boolean;
  subscriptionStatus?: string | null;
  daysRemaining?: number;
  renewalSoon?: boolean;
  periodEnd?: string | null;
}

export default function SellerTrialBanner() {
  const { token } = useAuth();
  const t = useTranslations("sellerTrial");
  const [sellerStatus, setSellerStatus] = useState<SellerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchStatus() {
      try {
        const res = await fetch("/api/auth/seller-status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch seller status");
        const data = await res.json();
        if (!cancelled) setSellerStatus(data);
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStatus();
    return () => { cancelled = true; };
  }, [token]);

  const handleActivate = async () => {
    if (!token || redirecting) return;
    setRedirecting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/seller-fee", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate payment");
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setRedirecting(false);
    }
  };

  // Don't render for non-sellers, during loading, or if active and not near renewal
  if (loading || !sellerStatus || sellerStatus.role !== "seller") return null;
  if (sellerStatus.canList && !sellerStatus.renewalSoon) return null;

  const isExpired = !sellerStatus.canList;
  const daysRemaining = sellerStatus.daysRemaining || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className={`relative rounded-2xl overflow-hidden border ${isExpired ? "border-red-500/30" : "border-amber-500/30"}`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${isExpired ? "from-red-950/60 via-card to-red-950/30" : "from-amber-950/40 via-card to-amber-950/20"}`} />

          <div className="relative p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${isExpired ? "bg-red-500/15 border-red-500/30" : "bg-amber-500/15 border-amber-500/30"}`}>
                  {isExpired ? <AlertTriangle size={22} className="text-red-400" /> : <Clock size={22} className="text-amber-400" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">
                    {isExpired ? t("accessExpired") : t("renewalSoon", { days: daysRemaining })}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {isExpired ? t("payToRestore", { fee: "$100" }) : t("renewToKeepAccess")}
                  </p>
                </div>
              </div>

              <button
                onClick={handleActivate}
                disabled={redirecting}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0 ${
                  isExpired
                    ? "bg-red-500 hover:bg-red-600 shadow-[0_0_25px_rgba(239,68,68,0.2)]"
                    : "bg-amber-500 hover:bg-amber-600 shadow-[0_0_25px_rgba(245,158,11,0.2)]"
                }`}
              >
                {redirecting ? (
                  <><Loader2 size={16} className="animate-spin" />{t("redirecting")}</>
                ) : (
                  <><CreditCard size={16} />{isExpired ? t("activateAccount") : t("renewNow")}</>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
