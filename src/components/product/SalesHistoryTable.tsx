"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Clock, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface SaleRecord {
  date: string;
  size?: string;
  price: number;
}

interface SalesHistoryResponse {
  sales: SaleRecord[];
  summary: {
    avgPrice: number;
    highPrice: number;
    lowPrice: number;
    totalSales: number;
    volatility: number;
    priceChange: number;
    priceChangePercent: number;
  };
}

const PAGE_SIZE = 10;

export default function SalesHistoryTable({
  productId,
  selectedSize = null,
}: {
  productId: string;
  selectedSize?: string | null;
}) {
  const t = useTranslations("product");
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setVisibleCount(PAGE_SIZE);

    const params = new URLSearchParams();
    params.set("period", "ALL");
    params.set("limit", "200");
    if (selectedSize) params.set("size", selectedSize);

    fetch(`/api/products/${productId}/sales-history?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: SalesHistoryResponse) => {
        if (!cancelled) {
          // Sort by most recent first
          const sorted = [...json.sales].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setSales(sorted);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, selectedSize]);

  const visibleSales = sales.slice(0, visibleCount);
  const hasMore = visibleCount < sales.length;

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 flex items-center justify-center">
        <Loader2 size={24} className="text-muted animate-spin" />
      </div>
    );
  }

  if (error || sales.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border py-12 text-center">
        <Clock size={24} className="mx-auto text-muted/30 mb-2" />
        <p className="text-sm text-muted">{t("noRecentSales")}</p>
        <p className="text-[11px] text-muted/50 mt-1">
          {t("salesWillAppear")}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.04] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Clock size={16} className="text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">{t("recentSales")}</h3>
          <p className="text-[11px] text-muted/60 mt-0.5">
            {t("salesRecorded", { count: sales.length })}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-muted/60 uppercase tracking-wider">
                {t("date")}
              </th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-muted/60 uppercase tracking-wider">
                {t("size")}
              </th>
              <th className="px-5 py-3 text-right text-[10px] font-semibold text-muted/60 uppercase tracking-wider">
                {t("salePrice")}
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleSales.map((sale, i) => (
              <tr
                key={`${sale.date}-${sale.price}-${i}`}
                className={`transition-colors hover:bg-white/[0.02] ${
                  i < visibleSales.length - 1 ? "border-b border-white/[0.04]" : ""
                }`}
              >
                <td className="px-5 py-3 text-sm text-muted">
                  {new Date(sale.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-5 py-3 text-sm text-foreground font-medium">
                  {sale.size || "--"}
                </td>
                <td className="px-5 py-3 text-sm text-foreground font-bold text-right">
                  {formatPrice(sale.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show More */}
      {hasMore && (
        <div className="px-5 py-3 border-t border-white/[0.04]">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-primary hover:text-primary-dark transition-colors cursor-pointer rounded-lg hover:bg-primary/[0.04]"
          >
            <ChevronDown size={14} />
            {t("showMore")} ({sales.length - visibleCount})
          </button>
        </div>
      )}
    </div>
  );
}
