"use client";

import { useState } from "react";
import { X, Check, Crown, Loader2, Zap, Building2 } from "lucide-react";

const TIERS = [
  {
    id: "standard",
    label: "Standard",
    price: 100,
    icon: Zap,
    color: "text-muted",
    bgColor: "bg-white/[0.04]",
    borderColor: "border-border",
    features: [
      "Unlimited product listings",
      "Access to all seller tools",
      "Standard customer support",
      "Escrow & buyer protection",
    ],
  },
  {
    id: "pro",
    label: "Pro",
    price: 299,
    icon: Crown,
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
    borderColor: "border-violet-400/30",
    popular: true,
    features: [
      "Everything in Standard",
      "2 free Featured slots per month (24h)",
      "Priority dispute resolution",
      "Advanced sales analytics",
    ],
  },
  {
    id: "enterprise",
    label: "Enterprise",
    price: 799,
    icon: Building2,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/30",
    features: [
      "Everything in Pro",
      "5 free Featured slots per month (3-day)",
      "Dedicated account manager",
      "Bulk product upload",
    ],
  },
];

interface TierSelectionModalProps {
  token: string;
  currentTier?: string;
  onClose: () => void;
  title?: string;
}

export default function TierSelectionModal({ token, currentTier, onClose, title }: TierSelectionModalProps) {
  const [selected, setSelected] = useState<string>(currentTier || "standard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/seller-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tier: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start checkout");
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  const selectedTier = TIERS.find((t) => t.id === selected)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h3 className="text-lg font-bold text-foreground">{title || "Choose Your Plan"}</h3>
            <p className="text-[12px] text-muted mt-0.5">Billed every 30 days. Cancel or change anytime.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {TIERS.map((tier) => {
              const Icon = tier.icon;
              const isSelected = selected === tier.id;
              const isCurrent = currentTier === tier.id;
              return (
                <button
                  key={tier.id}
                  onClick={() => setSelected(tier.id)}
                  className={`relative flex flex-col p-5 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? `${tier.borderColor} ${tier.bgColor}`
                      : "border-border bg-surface/40 hover:border-border-hover"
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-2 right-4 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-primary text-white rounded-md">
                      Most Popular
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-2 left-4 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-500 text-white rounded-md">
                      Current
                    </span>
                  )}
                  <div className={`w-9 h-9 rounded-xl ${tier.bgColor} ${tier.color} flex items-center justify-center mb-3`}>
                    <Icon size={18} />
                  </div>
                  <p className={`text-sm font-bold ${isSelected ? tier.color : "text-foreground"}`}>{tier.label}</p>
                  <div className="flex items-baseline gap-1 mt-1 mb-4">
                    <span className="text-2xl font-black text-foreground">${tier.price}</span>
                    <span className="text-[11px] text-muted">/month</span>
                  </div>
                  <ul className="space-y-1.5 flex-1">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-[11px] text-muted">
                        <Check size={12} className={`${tier.color} shrink-0 mt-0.5`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Redirecting to payment...
              </>
            ) : (
              <>Continue with {selectedTier.label} — ${selectedTier.price}/mo</>
            )}
          </button>
          <p className="text-[10px] text-muted text-center mt-3">
            Secure payment via Stripe. Card & Alipay accepted.
          </p>
        </div>
      </div>
    </div>
  );
}
