"use client";

import { useState } from "react";
import { X, TrendingUp, Loader2, Tag, Search } from "lucide-react";
import { createSponsoredCheckout } from "@/lib/api-products";
import { useAuth } from "@/context/AuthContext";

const PRICING = {
  category: { perDay: 15, label: "Category page" },
  keyword: { perDay: 10, label: "Search keyword" },
};

const DURATIONS = [
  { days: 1, label: "24 hours" },
  { days: 3, label: "3 days" },
  { days: 7, label: "7 days" },
];

interface SponsorListingModalProps {
  productId: string;
  productName: string;
  productCategory: string;
  onClose: () => void;
}

export default function SponsorListingModal({ productId, productName, productCategory, onClose }: SponsorListingModalProps) {
  const { token } = useAuth();
  const [targetType, setTargetType] = useState<"category" | "keyword">("category");
  const [keyword, setKeyword] = useState("");
  const [duration, setDuration] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pricing = PRICING[targetType];
  const totalPrice = pricing.perDay * duration;

  const handleSponsor = async () => {
    if (!token || loading) return;
    if (targetType === "keyword" && !keyword.trim()) {
      setError("Please enter a search keyword");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { checkoutUrl } = await createSponsoredCheckout(
        productId,
        targetType,
        targetType === "category" ? { category: productCategory } : { keyword: keyword.trim() },
        duration,
        token
      );
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
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Sponsor Listing</h3>
              <p className="text-[11px] text-muted truncate max-w-[240px]">{productName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-[12px] text-muted mb-4">Appear at the top of search or category results.</p>

          {/* Target type selector */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setTargetType("category")}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                targetType === "category"
                  ? "border-amber-400/40 bg-amber-400/[0.08]"
                  : "border-border bg-surface/50 hover:border-border-hover"
              }`}
            >
              <Tag size={14} className={targetType === "category" ? "text-amber-400" : "text-muted"} />
              <div>
                <p className={`text-[12px] font-semibold ${targetType === "category" ? "text-amber-400" : "text-foreground"}`}>Category</p>
                <p className="text-[9px] text-muted">$15/day</p>
              </div>
            </button>
            <button
              onClick={() => setTargetType("keyword")}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                targetType === "keyword"
                  ? "border-amber-400/40 bg-amber-400/[0.08]"
                  : "border-border bg-surface/50 hover:border-border-hover"
              }`}
            >
              <Search size={14} className={targetType === "keyword" ? "text-amber-400" : "text-muted"} />
              <div>
                <p className={`text-[12px] font-semibold ${targetType === "keyword" ? "text-amber-400" : "text-foreground"}`}>Search</p>
                <p className="text-[9px] text-muted">$10/day</p>
              </div>
            </button>
          </div>

          {/* Target details */}
          {targetType === "category" ? (
            <div className="mb-4 p-3 rounded-xl bg-surface border border-border">
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-0.5">Targeting category</p>
              <p className="text-sm font-semibold text-foreground capitalize">{productCategory}</p>
            </div>
          ) : (
            <div className="mb-4">
              <label className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1.5 block">Search keyword</label>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. air jordan, vintage denim"
                maxLength={100}
                className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-amber-400/40"
              />
            </div>
          )}

          {/* Duration */}
          <div className="space-y-2 mb-5">
            {DURATIONS.map((d) => {
              const isSelected = duration === d.days;
              const price = pricing.perDay * d.days;
              return (
                <button
                  key={d.days}
                  onClick={() => setDuration(d.days)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-amber-400/40 bg-amber-400/[0.08]"
                      : "border-border bg-surface hover:border-border-hover"
                  }`}
                >
                  <p className={`text-sm font-semibold ${isSelected ? "text-amber-400" : "text-foreground"}`}>{d.label}</p>
                  <p className={`text-sm font-bold ${isSelected ? "text-amber-400" : "text-foreground"}`}>${price}</p>
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
            onClick={handleSponsor}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Redirecting to payment...
              </>
            ) : (
              <>
                <TrendingUp size={16} />
                Sponsor for ${totalPrice}
              </>
            )}
          </button>

          <p className="text-[10px] text-muted text-center mt-3">Payment via Stripe. Alipay accepted.</p>
        </div>
      </div>
    </div>
  );
}
