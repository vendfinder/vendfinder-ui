"use client";

import Link from "next/link";
import { ShoppingCart, Package, Eye } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import Rating from "@/components/ui/Rating";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  const discountPercent = product.compareAtPrice
    ? Math.round(
        ((product.compareAtPrice - product.price) / product.compareAtPrice) *
          100
      )
    : null;

  return (
    <div className="group bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:border-border-hover hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)] hover:-translate-y-1">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="block relative">
        <div className="aspect-square bg-surface flex items-center justify-center overflow-hidden relative">
          <Package
            size={48}
            className="text-muted/15 group-hover:text-muted/25 transition-colors duration-300"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Quick view hint */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white text-[10px] font-semibold flex items-center gap-1.5">
              <Eye size={11} />
              Quick View
            </span>
          </div>
        </div>
        {discountPercent && (
          <span className="absolute top-3 left-3 px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-accent text-white rounded-lg shadow-lg">
            -{discountPercent}%
          </span>
        )}
        {product.stockCount && product.stockCount <= 5 && (
          <span className="absolute top-3 right-3 px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-black/50 text-amber-300 rounded-lg backdrop-blur-sm border border-amber-400/20">
            Low stock
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="p-4">
        <p className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold mb-1.5">
          {product.category.replace("-", " & ")}
        </p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5">
          <Rating value={product.rating} count={product.reviewCount} />
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-muted line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          <button
            onClick={() => addItem(product)}
            className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark hover:shadow-[0_0_16px_rgba(232,136,58,0.3)] transition-all cursor-pointer"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
