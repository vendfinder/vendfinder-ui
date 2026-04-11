"use client";

import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ProductContextCardProps {
  product: { id: string; name: string; image: string; price: number };
}

export default function ProductContextCard({
  product,
}: ProductContextCardProps) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="flex items-center gap-3 px-4 py-3 bg-surface/60 border-b border-border/50 hover:bg-surface transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-card border border-border overflow-hidden shrink-0 relative">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="40px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={16} className="text-muted/30" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-foreground truncate">
          {product.name}
        </p>
        <p className="text-[11px] font-bold text-primary">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}
