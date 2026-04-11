"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, AlertTriangle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

interface KycStatus {
  status: "not_required" | "required" | "submitted" | "verified" | "rejected";
  daysRemaining: number;
  gracePeriodExpired: boolean;
}

export default function KYCBanner() {
  const t = useTranslations("kyc");
  const { token } = useAuth();
  const [kyc, setKyc] = useState<KycStatus | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/auth/kyc-status", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setKyc(data);
      })
      .catch(() => {});
  }, [token]);

  if (!kyc) return null;
  if (kyc.status === "not_required" || kyc.status === "verified") return null;

  if (kyc.status === "submitted") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 rounded-2xl border border-blue-500/30 bg-blue-500/[0.06] flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
          <Clock size={18} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{t("verificationInProgress")}</p>
          <p className="text-[11px] text-muted">{t("verificationInProgressDesc")}</p>
        </div>
      </motion.div>
    );
  }

  const isUrgent = kyc.gracePeriodExpired || kyc.daysRemaining <= 3;
  const color = kyc.status === "rejected" || isUrgent ? "red" : "amber";
  const Icon = kyc.status === "rejected" ? AlertTriangle : BadgeCheck;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 p-4 rounded-2xl border flex items-center justify-between gap-4 ${
        color === "red"
          ? "border-red-500/30 bg-red-500/[0.06]"
          : "border-amber-500/30 bg-amber-500/[0.06]"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          color === "red" ? "bg-red-500/15" : "bg-amber-500/15"
        }`}>
          <Icon size={18} className={color === "red" ? "text-red-400" : "text-amber-400"} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {kyc.status === "rejected"
              ? t("verificationRejected")
              : kyc.gracePeriodExpired
                ? t("verificationRequired")
                : `${t("verificationRequired")} — ${t("daysRemaining", { days: kyc.daysRemaining })}`}
          </p>
          <p className="text-[11px] text-muted">
            {kyc.status === "rejected"
              ? t("verificationRejectedDesc")
              : kyc.gracePeriodExpired
                ? t("verificationRequiredDesc")
                : t("verificationRequiredDesc")}
          </p>
        </div>
      </div>
      <Link
        href="/dashboard/kyc"
        className={`shrink-0 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-colors ${
          color === "red" ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"
        }`}
      >
{t("completeKyc")}
      </Link>
    </motion.div>
  );
}
