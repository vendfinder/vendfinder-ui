"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Flame, ShoppingCart, Package } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/MotionWrapper";

export default function HotDeals({ products }: { products: Product[] }) {
  const t = useTranslations("hotDeals");
  const { addItem } = useCart();
  const deals = products;

  return (
    <section className="py-16 lg:py-24 bg-dark relative overflow-hidden">
      {/* Subtle red glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="flex items-center gap-3 mb-2">
            <Flame size={20} className="text-accent" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              {t("badge")}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground tracking-tight mb-10">
            {t("title")}
          </h2>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {deals.map((product) => {
            const discount = product.compareAtPrice
              ? Math.round(
                  ((product.compareAtPrice - product.price) /
                    product.compareAtPrice) *
                    100
                )
              : 0;

            return (
              <StaggerItem key={product.id}>
                <div className="group bg-card border border-border rounded-xl overflow-hidden hover:border-accent/30 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(255,71,87,0.08)]">
                  <Link
                    href={`/products/${product.slug}`}
                    className="block relative"
                  >
                    <div className="aspect-square bg-surface flex items-center justify-center relative overflow-hidden">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <Package
                          size={44}
                          className="text-border group-hover:text-muted transition-colors"
                        />
                      )}
                    </div>
                    <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-black uppercase tracking-wider bg-accent text-white rounded-full">
                      {t("percentOff", { discount })}
                    </span>
                  </Link>

                  <div className="p-4">
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">
                      {product.category.replace("-", " & ")}
                    </p>
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="text-sm font-semibold text-foreground line-clamp-1 hover:text-accent transition-colors">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-foreground">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-sm text-muted line-through">
                          {formatPrice(product.compareAtPrice!)}
                        </span>
                      </div>
                      <button
                        onClick={() => addItem(product)}
                        className="w-9 h-9 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent-dark transition-colors cursor-pointer"
                        aria-label={`Add ${product.name} to cart`}
                      >
                        <ShoppingCart size={15} />
                      </button>
                    </div>

                    {/* Savings badge */}
                    <div className="mt-2 px-2 py-1 bg-accent/10 text-accent text-xs font-bold rounded text-center">
                      {t("youSave", { amount: formatPrice(product.compareAtPrice! - product.price) })}
                    </div>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
