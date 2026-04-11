"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { TrendingUp, TrendingDown, Activity, BarChart3, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

// --- Types ---

interface SalePoint {
  date: string;
  price: number;
  size?: string;
}

interface SalesHistoryResponse {
  sales: SalePoint[];
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

type Period = "1M" | "3M" | "6M" | "1Y" | "ALL";

const PERIOD_KEYS: Period[] = ["1M", "3M", "6M", "1Y", "ALL"];

const PERIOD_TRANSLATION_KEYS: Record<Period, string> = {
  "1M": "period1M",
  "3M": "period3M",
  "6M": "period6M",
  "1Y": "period1Y",
  "ALL": "periodAll",
};

// --- SVG Chart ---

interface ChartDimensions {
  width: number;
  height: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
}

function buildPath(
  sales: SalePoint[],
  dims: ChartDimensions,
  minPrice: number,
  maxPrice: number
): { linePath: string; areaPath: string } {
  const { width, height, paddingTop, paddingRight, paddingBottom, paddingLeft } = dims;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;
  const priceRange = maxPrice - minPrice || 1;

  const points = sales.map((s, i) => {
    const x = paddingLeft + (i / Math.max(sales.length - 1, 1)) * chartW;
    const y = paddingTop + chartH - ((s.price - minPrice) / priceRange) * chartH;
    return { x, y };
  });

  if (points.length === 0) return { linePath: "", areaPath: "" };
  if (points.length === 1) {
    const p = points[0];
    return {
      linePath: `M ${p.x} ${p.y} L ${p.x + 1} ${p.y}`,
      areaPath: `M ${p.x} ${p.y} L ${p.x + 1} ${p.y} L ${p.x + 1} ${paddingTop + chartH} L ${p.x} ${paddingTop + chartH} Z`,
    };
  }

  // Smooth curve using cubic bezier
  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const bottomY = paddingTop + chartH;
  const areaPath = `${linePath} L ${lastPoint.x} ${bottomY} L ${firstPoint.x} ${bottomY} Z`;

  return { linePath, areaPath };
}

function getGridLines(
  minPrice: number,
  maxPrice: number,
  count: number
): number[] {
  const range = maxPrice - minPrice || 1;
  const lines: number[] = [];
  for (let i = 0; i <= count; i++) {
    lines.push(minPrice + (range / count) * i);
  }
  return lines;
}

function formatDateLabel(dateStr: string, totalDays: number): string {
  const date = new Date(dateStr);
  if (totalDays <= 31) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (totalDays <= 365) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function getDateLabels(
  sales: SalePoint[],
  maxLabels: number
): { index: number; label: string }[] {
  if (sales.length === 0) return [];
  const first = new Date(sales[0].date);
  const last = new Date(sales[sales.length - 1].date);
  const totalDays = Math.max(1, (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));

  const step = Math.max(1, Math.floor(sales.length / maxLabels));
  const labels: { index: number; label: string }[] = [];
  for (let i = 0; i < sales.length; i += step) {
    labels.push({ index: i, label: formatDateLabel(sales[i].date, totalDays) });
  }
  // Always include the last label
  const lastIdx = sales.length - 1;
  if (labels.length === 0 || labels[labels.length - 1].index !== lastIdx) {
    labels.push({ index: lastIdx, label: formatDateLabel(sales[lastIdx].date, totalDays) });
  }
  return labels;
}

// --- Component ---

export default function PriceHistoryChart({
  productId,
  selectedSize = null,
}: {
  productId: string;
  selectedSize?: string | null;
}) {
  const t = useTranslations("product");
  const [period, setPeriod] = useState<Period>("3M");
  const [data, setData] = useState<SalesHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Responsive width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);

    return () => observer.disconnect();
  }, []);

  // Fetch sales history
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("period", period);
    if (selectedSize) params.set("size", selectedSize);

    fetch(`/api/products/${productId}/sales-history?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: SalesHistoryResponse) => {
        if (!cancelled) setData(json);
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
  }, [productId, period, selectedSize]);

  // Chart dimensions
  const dims: ChartDimensions = useMemo(() => ({
    width: containerWidth || 600,
    height: 280,
    paddingTop: 20,
    paddingRight: 16,
    paddingBottom: 32,
    paddingLeft: 58,
  }), [containerWidth]);

  const sales = data?.sales ?? [];
  const summary = data?.summary;

  // Price range with 10% padding
  const { minPrice, maxPrice } = useMemo(() => {
    if (sales.length === 0) return { minPrice: 0, maxPrice: 100 };
    const prices = sales.map((s) => s.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const pad = (max - min) * 0.1 || 5;
    return { minPrice: Math.max(0, min - pad), maxPrice: max + pad };
  }, [sales]);

  const { linePath, areaPath } = useMemo(
    () => buildPath(sales, dims, minPrice, maxPrice),
    [sales, dims, minPrice, maxPrice]
  );
  const gridLines = useMemo(() => getGridLines(minPrice, maxPrice, 4), [minPrice, maxPrice]);
  const dateLabels = useMemo(() => getDateLabels(sales, 6), [sales]);

  // Mouse hover
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (sales.length === 0 || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const chartW = dims.width - dims.paddingLeft - dims.paddingRight;
      const relX = mouseX - dims.paddingLeft;
      const idx = Math.round((relX / chartW) * (sales.length - 1));
      setHoverIndex(Math.max(0, Math.min(idx, sales.length - 1)));
    },
    [sales, dims]
  );

  const handleMouseLeave = useCallback(() => setHoverIndex(null), []);

  // Hover point position
  const hoverPoint = useMemo(() => {
    if (hoverIndex === null || sales.length === 0) return null;
    const chartW = dims.width - dims.paddingLeft - dims.paddingRight;
    const chartH = dims.height - dims.paddingTop - dims.paddingBottom;
    const priceRange = maxPrice - minPrice || 1;
    const x = dims.paddingLeft + (hoverIndex / Math.max(sales.length - 1, 1)) * chartW;
    const y = dims.paddingTop + chartH - ((sales[hoverIndex].price - minPrice) / priceRange) * chartH;
    return { x, y, sale: sales[hoverIndex] };
  }, [hoverIndex, sales, dims, minPrice, maxPrice]);

  // Y-axis label positions
  const gridLabelPositions = useMemo(() => {
    const chartH = dims.height - dims.paddingTop - dims.paddingBottom;
    const priceRange = maxPrice - minPrice || 1;
    return gridLines.map((price) => ({
      price,
      y: dims.paddingTop + chartH - ((price - minPrice) / priceRange) * chartH,
    }));
  }, [gridLines, dims, minPrice, maxPrice]);

  // X-axis label positions
  const dateLabelPositions = useMemo(() => {
    const chartW = dims.width - dims.paddingLeft - dims.paddingRight;
    return dateLabels.map((dl) => ({
      ...dl,
      x: dims.paddingLeft + (dl.index / Math.max(sales.length - 1, 1)) * chartW,
    }));
  }, [dateLabels, dims, sales.length]);

  // Price change indicator
  const priceChangeColor = (summary?.priceChange ?? 0) >= 0 ? "text-emerald-400" : "text-red-400";
  const PriceChangeIcon = (summary?.priceChange ?? 0) >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{t("priceHistory")}</h3>
            {summary && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <PriceChangeIcon size={12} className={priceChangeColor} />
                <span className={`text-[11px] font-semibold ${priceChangeColor}`}>
                  {(summary.priceChange >= 0 ? "+" : "") + formatPrice(summary.priceChange)}
                  {" "}
                  ({(summary.priceChangePercent >= 0 ? "+" : "") + summary.priceChangePercent.toFixed(1)}%)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Period filters */}
        <div className="flex gap-1 p-1 bg-surface/60 rounded-lg border border-border/60">
          {PERIOD_KEYS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                period === p
                  ? "bg-primary text-white shadow-[0_0_12px_rgba(232,136,58,0.15)]"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t(PERIOD_TRANSLATION_KEYS[p])}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div ref={containerRef} className="px-2 pb-2 relative">
        {loading ? (
          <div className="flex items-center justify-center h-[280px]">
            <Loader2 size={24} className="text-muted animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[280px] text-center px-4">
            <Activity size={28} className="text-muted/30 mb-2" />
            <p className="text-sm text-muted">{t("noSalesData")}</p>
            <p className="text-[11px] text-muted/50 mt-1">
              {t("priceHistoryWillAppear")}
            </p>
          </div>
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[280px] text-center px-4">
            <Activity size={28} className="text-muted/30 mb-2" />
            <p className="text-sm text-muted">{t("noSalesData")}</p>
            <p className="text-[11px] text-muted/50 mt-1">
              {t("priceHistoryWillAppear")}
            </p>
          </div>
        ) : (
          <svg
            ref={svgRef}
            width={dims.width}
            height={dims.height}
            className="select-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id={`areaGrad-${productId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E8883A" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#E8883A" stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {gridLabelPositions.map((gl, i) => (
              <g key={i}>
                <line
                  x1={dims.paddingLeft}
                  y1={gl.y}
                  x2={dims.width - dims.paddingRight}
                  y2={gl.y}
                  stroke="white"
                  strokeOpacity={0.04}
                  strokeDasharray="4 4"
                />
                <text
                  x={dims.paddingLeft - 8}
                  y={gl.y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-current text-muted/60"
                >
                  ${Math.round(gl.price)}
                </text>
              </g>
            ))}

            {/* X-axis date labels */}
            {dateLabelPositions.map((dl, i) => (
              <text
                key={i}
                x={dl.x}
                y={dims.height - 6}
                textAnchor="middle"
                className="text-[10px] fill-current text-muted/60"
              >
                {dl.label}
              </text>
            ))}

            {/* Area fill */}
            <path d={areaPath} fill={`url(#areaGrad-${productId})`} />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#E8883A"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Hover elements */}
            {hoverPoint && (
              <>
                {/* Vertical line */}
                <line
                  x1={hoverPoint.x}
                  y1={dims.paddingTop}
                  x2={hoverPoint.x}
                  y2={dims.height - dims.paddingBottom}
                  stroke="white"
                  strokeOpacity={0.1}
                  strokeDasharray="3 3"
                />
                {/* Dot */}
                <circle
                  cx={hoverPoint.x}
                  cy={hoverPoint.y}
                  r={5}
                  fill="#E8883A"
                  stroke="#1a1a1a"
                  strokeWidth={2}
                />
                {/* Glow */}
                <circle
                  cx={hoverPoint.x}
                  cy={hoverPoint.y}
                  r={10}
                  fill="#E8883A"
                  fillOpacity={0.15}
                />
              </>
            )}
          </svg>
        )}

        {/* Tooltip (rendered as HTML for crisp text) */}
        {hoverPoint && (
          <div
            className="absolute pointer-events-none z-10"
            style={{
              left: Math.min(
                hoverPoint.x + 8,
                (containerWidth || 600) - 140
              ),
              top: hoverPoint.y - 50,
            }}
          >
            <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-xl">
              <p className="text-xs font-bold text-foreground">
                {formatPrice(hoverPoint.sale.price)}
              </p>
              <p className="text-[10px] text-muted">
                {new Date(hoverPoint.sale.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              {hoverPoint.sale.size && (
                <p className="text-[10px] text-muted/60">
                  {t("size")} {hoverPoint.sale.size}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Market Summary Stats */}
      {summary && !loading && sales.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 border-t border-white/[0.04]">
          <SummaryStat label={t("avgSalePrice")} value={formatPrice(summary.avgPrice)} />
          <SummaryStat label={t("high")} value={formatPrice(summary.highPrice)} accent="emerald" />
          <SummaryStat label={t("low")} value={formatPrice(summary.lowPrice)} accent="red" />
          <SummaryStat label={t("totalSales")} value={summary.totalSales.toLocaleString()} />
          <SummaryStat
            label={t("volatility")}
            value={`${summary.volatility.toFixed(1)}%`}
            last
          />
        </div>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  accent,
  last,
}: {
  label: string;
  value: string;
  accent?: "emerald" | "red";
  last?: boolean;
}) {
  const valueColor =
    accent === "emerald"
      ? "text-emerald-400"
      : accent === "red"
        ? "text-red-400"
        : "text-foreground";

  return (
    <div
      className={`px-4 py-3.5 ${!last ? "border-r border-white/[0.04]" : ""} ${
        "sm:border-r sm:last:border-r-0"
      }`}
    >
      <p className="text-[10px] text-muted/60 font-semibold uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-sm font-bold mt-0.5 ${valueColor}`}>{value}</p>
    </div>
  );
}
