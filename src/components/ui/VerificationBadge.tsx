"use client";

import { CheckCircle2, Crown, Star, ShieldCheck } from "lucide-react";

interface VerificationBadgeProps {
  verified?: boolean;
  proSeller?: boolean;
  topRated?: boolean;
  kycVerified?: boolean;
  size?: "sm" | "md";
  iconOnly?: boolean;
}

export default function VerificationBadge({
  verified,
  proSeller,
  topRated,
  kycVerified,
  size = "md",
  iconOnly = false,
}: VerificationBadgeProps) {
  const iconSize = size === "sm" ? 10 : 12;
  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1";
  const textSize = size === "sm" ? "text-[9px]" : "text-[10px]";

  const badges = [];

  if (verified) {
    badges.push({
      key: "verified",
      icon: CheckCircle2,
      label: "Verified",
      className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    });
  }
  if (proSeller) {
    badges.push({
      key: "pro",
      icon: Crown,
      label: "Pro Seller",
      className: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    });
  }
  if (topRated) {
    badges.push({
      key: "top",
      icon: Star,
      label: "Top Rated",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    });
  }
  if (kycVerified) {
    badges.push({
      key: "kyc",
      icon: ShieldCheck,
      label: "KYC Verified",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="inline-flex items-center gap-1.5">
      {badges.map((b) => {
        const Icon = b.icon;
        return (
          <span
            key={b.key}
            title={b.label}
            className={`inline-flex items-center gap-1 ${padding} ${textSize} font-bold uppercase tracking-wider rounded-lg border ${b.className}`}
          >
            <Icon size={iconSize} className={b.key === "top" ? "fill-current" : ""} />
            {!iconOnly && <span>{b.label}</span>}
          </span>
        );
      })}
    </div>
  );
}
