"use client";

import Link from "next/link";
import { ArrowRight, Package, Star } from "lucide-react";
import Button from "@/components/ui/Button";
import { FadeIn } from "@/components/motion/MotionWrapper";
import { getFeaturedProducts } from "@/data/products";
import { formatPrice } from "@/lib/utils";

export default function HeroSection() {
  const spotlightProduct = getFeaturedProducts()[0];

  return (
    <section className="relative overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface via-dark to-dark" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_40%,rgba(232,136,58,0.06),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Diagonal accent line */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/[0.03] to-transparent -skew-x-12 origin-top-right" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left — Copy */}
          <div>
            <FadeIn>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
                New drops every week
              </span>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black text-foreground leading-[0.95] tracking-tight">
                Find Your{" "}
                <span className="italic text-primary">Next</span>
                <br />
                Obsession
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="mt-6 text-lg text-muted max-w-lg leading-relaxed">
                From exclusive sneaker drops to the latest tech and streetwear
                — shop thousands of curated products from brands that matter.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button href="/products" size="lg">
                  Shop Now
                  <ArrowRight size={18} className="ml-2" />
                </Button>
                <Button
                  href="/categories/sneakers"
                  variant="outline"
                  size="lg"
                  className="border-border text-foreground hover:border-primary hover:text-primary"
                >
                  Browse Categories
                </Button>
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="mt-14 flex items-center gap-8 text-sm">
                <div>
                  <span className="block text-3xl font-black text-foreground font-display">
                    10K+
                  </span>
                  <span className="text-muted">Products</span>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <span className="block text-3xl font-black text-foreground font-display">
                    500+
                  </span>
                  <span className="text-muted">Brands</span>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <span className="block text-3xl font-black text-foreground font-display">
                    50K+
                  </span>
                  <span className="text-muted">Customers</span>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Right — Product Spotlight */}
          <FadeIn delay={0.2} className="hidden lg:block">
            <div className="relative">
              {/* Glow behind card */}
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-3xl blur-2xl" />

              <Link
                href={`/products/${spotlightProduct.slug}`}
                className="relative block group"
              >
                <div className="bg-card border border-border rounded-2xl overflow-hidden transition-all duration-500 group-hover:border-primary/30 group-hover:shadow-[0_16px_64px_rgba(232,136,58,0.1)]">
                  {/* Product image area */}
                  <div className="aspect-[4/3] bg-surface flex items-center justify-center relative">
                    <Package
                      size={80}
                      className="text-border group-hover:text-muted transition-colors duration-500"
                    />
                    {spotlightProduct.compareAtPrice && (
                      <span className="absolute top-4 left-4 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-accent text-white rounded-full">
                        Sale
                      </span>
                    )}
                    <span className="absolute top-4 right-4 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-primary/90 text-white rounded-full">
                      Featured
                    </span>
                  </div>

                  {/* Product details */}
                  <div className="p-6">
                    <p className="text-xs text-muted uppercase tracking-wider mb-2">
                      {spotlightProduct.category}
                    </p>
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {spotlightProduct.name}
                    </h3>
                    <p className="text-sm text-muted mb-4 line-clamp-2">
                      {spotlightProduct.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-foreground">
                          {formatPrice(spotlightProduct.price)}
                        </span>
                        {spotlightProduct.compareAtPrice && (
                          <span className="text-sm text-muted line-through">
                            {formatPrice(spotlightProduct.compareAtPrice)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star
                          size={14}
                          className="fill-primary text-primary"
                        />
                        <span className="text-sm font-semibold text-foreground">
                          {spotlightProduct.rating}
                        </span>
                        <span className="text-xs text-muted">
                          ({spotlightProduct.reviewCount})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
