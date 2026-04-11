"use client";

import { useTranslations } from "next-intl";
import { Package, CheckCircle2, AlertTriangle, Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface OrderContextCardProps {
  order: {
    id: string;
    productName: string;
    price: number;
    status: string;
  };
  onAction?: (action: string) => void;
}

function useStatusConfig() {
  const t = useTranslations("chat");
  return {
    pending_shipment: { label: t("pendingShipment"), color: "text-amber-400", icon: <Package size={12} /> },
    shipped: { label: t("shipped"), color: "text-blue-400", icon: <Package size={12} /> },
    delivered: { label: t("delivered"), color: "text-emerald-400", icon: <CheckCircle2 size={12} /> },
    authenticated: { label: t("authenticated"), color: "text-primary", icon: <CheckCircle2 size={12} /> },
  } as Record<string, { label: string; color: string; icon: React.ReactNode }>;
}

export default function OrderContextCard({ order, onAction }: OrderContextCardProps) {
  const t = useTranslations("chat");
  const statusConfig = useStatusConfig();
  const status = statusConfig[order.status] || statusConfig.pending_shipment;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-surface/60 border-b border-border/50">
      <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
        <Package size={16} className="text-muted/40" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-foreground truncate">
          Order #{order.id.slice(0, 8)}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] font-bold text-primary">
            {formatPrice(order.price)}
          </span>
          <span className="text-muted/30">&middot;</span>
          <span className={`text-[10px] font-semibold flex items-center gap-1 ${status.color}`}>
            {status.icon}
            {status.label}
          </span>
        </div>
      </div>
      {order.status === "delivered" && onAction && (
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => onAction("confirm")}
            className="px-2.5 py-1.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-400 rounded-lg hover:bg-emerald-500/25 transition-colors"
          >
            {t("confirm")}
          </button>
          <button
            onClick={() => onAction("dispute")}
            className="px-2.5 py-1.5 text-[10px] font-bold bg-red-500/15 text-red-400 rounded-lg hover:bg-red-500/25 transition-colors"
          >
            <AlertTriangle size={10} />
          </button>
          <button
            onClick={() => onAction("review")}
            className="px-2.5 py-1.5 text-[10px] font-bold bg-amber-500/15 text-amber-400 rounded-lg hover:bg-amber-500/25 transition-colors"
          >
            <Star size={10} />
          </button>
        </div>
      )}
    </div>
  );
}
