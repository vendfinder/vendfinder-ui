"use client";

import { useState } from "react";
import { X, Sparkles, Loader2, TrendingUp } from "lucide-react";
import { createFeaturedCheckout } from "@/lib/api-products";
import { useAuth } from "@/context/AuthContext";

const TIERS = [
  { days: 1, price: 25, label: "24 hours", description: "Quick boost" },
  { days: 3, price: 60, label: "3 days", description: "Save $15" },
  { days: 7, price: 125, label: "7 days", description: "Best value — save $50" },
];

interface FeatureListingModalProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

export default function FeatureListingModal({ productId, productName, onClose }: FeatureListingModalProps) {
  const { token } = useAuth();
  const [selected, setSelected] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFeature = async () => {
    if (!token || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { checkoutUrl } = await createFeaturedCheckout(productId, selected, token);
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Sparkles size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Feature on Homepage</h3>
              <p className="text-[11px] text-muted truncate max-w-[240px]">{productName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 mb-4 text-[12px] text-muted">
            <TrendingUp size={14} className="text-emerald-400" />
            <span>Get premium placement on the VendFinder homepage</span>
          </div>

          <div className="space-y-2.5 mb-5">
            {TIERS.map((tier) => {
              const isSelected = selected === tier.days;
              return (
                <button
                  key={tier.days}
                  onClick={() => setSelected(tier.days)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-primary/40 bg-primary/[0.08]"
                      : "border-border bg-surface hover:border-border-hover"
                  }`}
                >
                  <div>
                    <p className={`text-sm font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {tier.label}
                    </p>
                    <p className="text-[11px] text-muted">{tier.description}</p>
                  </div>
                  <p className={`text-lg font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                    ${tier.price}
                  </p>
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
            onClick={handleFeature}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Redirecting to payment...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Feature for ${TIERS.find((t) => t.days === selected)?.price}
              </>
            )}
          </button>

          <p className="text-[10px] text-muted text-center mt-3">
            Payment via Stripe. Alipay accepted.
          </p>
        </div>
      </div>
    </div>
  );
}
