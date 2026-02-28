"use client";

import Link from "next/link";
import { Star, Package, ShoppingCart, Award } from "lucide-react";
import { getTopRated } from "@/data/products";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/MotionWrapper";

export default function TopRated() {
  const { addItem } = useCart();
  const topProducts = getTopRated();

  // Separate #1 featured from the rest
  const hero = topProducts[0];
  const rest = topProducts.slice(1);

  return (
    <section className="py-16 lg:py-24 bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="flex items-center gap-3 mb-2">
            <Award size={20} className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Customer favorites
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground tracking-tight mb-10">
            Top Rated
          </h2>
        </FadeIn>

        <div className="grid lg:grid-cols-5 gap-4 lg:gap-5">
          {/* Hero / #1 product — 2 columns */}
          <FadeIn className="lg:col-span-2">
            <Link
              href={`/products/${hero.slug}`}
              className="group block h-full bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-[0_16px_48px_rgba(232,136,58,0.08)]"
            >
              <div className="aspect-[4/3] bg-surface flex items-center justify-center relative">
                <Package
                  size={64}
                  className="text-border group-hover:text-muted transition-colors"
                />
                <span className="absolute top-4 left-4 px-3 py-1 text-xs font-black uppercase tracking-wider bg-primary text-white rounded-full flex items-center gap-1">
                  <Star size={12} className="fill-white" />
                  #1 Rated
                </span>
              </div>
              <div className="p-6">
                <p className="text-xs text-muted uppercase tracking-wider mb-2">
                  {hero.category.replace("-", " & ")}
                </p>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                  {hero.name}
                </h3>
                <p className="text-sm text-muted line-clamp-2 mb-4">
                  {hero.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-foreground">
                    {formatPrice(hero.price)}
                  </span>
                  <div className="flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full">
                    <Star
                      size={14}
                      className="fill-primary text-primary"
                    />
                    <span className="text-sm font-bold text-primary">
                      {hero.rating}
                    </span>
                    <span className="text-xs text-muted">
                      ({hero.reviewCount})
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </FadeIn>

          {/* Remaining products — 3 columns grid */}
          <StaggerContainer className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {rest.map((product, idx) => (
              <StaggerItem key={product.id}>
                <div className="group bg-card border border-border rounded-xl overflow-hidden hover:border-border-hover transition-all duration-300 h-full flex flex-col">
                  <Link
                    href={`/products/${product.slug}`}
                    className="block relative flex-shrink-0"
                  >
                    <div className="aspect-square bg-surface flex items-center justify-center">
                      <Package
                        size={40}
                        className="text-border group-hover:text-muted transition-colors"
                      />
                    </div>
                    <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold bg-surface text-primary rounded-full flex items-center gap-0.5">
                      <Star size={10} className="fill-primary" />
                      {product.rating}
                    </span>
                    <span className="absolute top-3 left-3 w-6 h-6 rounded-full bg-dark/80 backdrop-blur-sm text-foreground text-xs font-black flex items-center justify-center">
                      {idx + 2}
                    </span>
                  </Link>

                  <div className="p-3 flex-1 flex flex-col">
                    <p className="text-[10px] text-muted uppercase tracking-wider mb-0.5">
                      {product.category.replace("-", " & ")}
                    </p>
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="text-sm font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <span className="text-base font-bold text-foreground">
                        {formatPrice(product.price)}
                      </span>
                      <button
                        onClick={() => addItem(product)}
                        className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors cursor-pointer"
                        aria-label={`Add ${product.name} to cart`}
                      >
                        <ShoppingCart size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
