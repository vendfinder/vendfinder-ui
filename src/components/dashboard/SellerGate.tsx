"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  CreditCard,
  DollarSign,
  Infinity,
  Store,
  ShieldOff,
  ShieldCheck,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import TierSelectionModal from "@/components/dashboard/TierSelectionModal";

interface SellerGateProps {
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}

export default function SellerGate({ children, backHref = "/dashboard", backLabel }: SellerGateProps) {
  const t = useTranslations("sellerGate");
  const { token } = useAuth();
  const router = useRouter();
  const [canList, setCanList] = useState<boolean | null>(null);
  const [renewalSoon, setRenewalSoon] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [currentTier, setCurrentTier] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [showTierModal, setShowTierModal] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function checkSellerStatus() {
      try {
        const res = await fetch("/api/auth/seller-status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to check seller status");
        const data = await res.json();
        if (!cancelled) {
          setCanList(data.canList);
          setRenewalSoon(data.renewalSoon || false);
          setDaysRemaining(data.daysRemaining || 0);
          setCurrentTier(data.tier);
        }
      } catch {
        if (!cancelled) setCanList(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkSellerStatus();
    return () => { cancelled = true; };
  }, [token]);

  const handleActivateAccount = () => {
    setShowTierModal(true);
  };
  const activating = false;
  const activateError: string | null = null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="text-primary animate-spin" />
          <p className="text-sm text-muted">{t("checking")}</p>
        </div>
      </div>
    );
  }

  if (canList === false) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft size={14} />
            {backLabel || t("backToDashboard")}
          </Link>

          <div className="relative rounded-2xl overflow-hidden border border-red-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-card to-card" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(239,68,68,0.1),transparent_60%)]" />

            <div className="relative p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto mb-5">
                <ShieldOff size={28} className="text-red-400" />
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-2">
                {t("title")}
              </h1>
              <p className="text-sm text-muted leading-relaxed max-w-md mx-auto mb-8">
                {t("description")}
              </p>

              <button
                onClick={handleActivateAccount}
                disabled={activating}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-red-500 to-primary hover:from-red-600 hover:to-primary-dark text-white text-base font-bold shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:shadow-[0_0_40px_rgba(239,68,68,0.3)] transition-all disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {activating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t("redirecting")}
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    {t("activateNow")}
                  </>
                )}
              </button>

              {activateError && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {activateError}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/[0.06]">
                {[
                  { icon: DollarSign, title: t("oneTimeFee"), description: t("oneTimeFeeDesc"), color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
                  { icon: Infinity, title: t("unlimitedListings"), description: t("unlimitedListingsDesc"), color: "text-blue-400", bgColor: "bg-blue-400/10" },
                  { icon: Store, title: t("fullAccess"), description: t("fullAccessDesc"), color: "text-violet-400", bgColor: "bg-violet-400/10" },
                ].map((signal) => (
                  <div key={signal.title} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl ${signal.bgColor} ${signal.color} flex items-center justify-center`}>
                      <signal.icon size={18} />
                    </div>
                    <p className="text-xs font-semibold text-foreground">{signal.title}</p>
                    <p className="text-[10px] text-muted">{signal.description}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 mt-6 text-[11px] text-muted">
                <ShieldCheck size={12} className="text-emerald-400" />
                {t("securePayment")}
              </div>
            </div>
          </div>
        </motion.div>
        {showTierModal && token && (
          <TierSelectionModal
            token={token}
            currentTier={currentTier}
            onClose={() => setShowTierModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <>
      {renewalSoon && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <CreditCard size={18} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t("renewalTitle", { days: daysRemaining })}
              </p>
              <p className="text-[11px] text-muted">{t("renewalDesc")}</p>
            </div>
          </div>
          <button
            onClick={handleActivateAccount}
            disabled={activating}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors disabled:opacity-50"
          >
            {activating ? t("redirecting") : t("renewNow")}
          </button>
        </motion.div>
      )}
      {children}
      {showTierModal && token && (
        <TierSelectionModal
          token={token}
          currentTier={currentTier}
          onClose={() => setShowTierModal(false)}
        />
      )}
    </>
  );
}
