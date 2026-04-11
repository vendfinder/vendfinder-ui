"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package, Star, Sparkles, TrendingUp } from "lucide-react";
import Button from "@/components/ui/Button";
import { FadeIn } from "@/components/motion/MotionWrapper";
import { useFormattedPrice } from "@/hooks/useFormattedPrice";
import { useTranslations } from "next-intl";
import { transformProduct } from "@/lib/api";
import type { Product } from "@/types";

export default function HeroSection() {
  const t = useTranslations();
  const formatPrice = useFormattedPrice();
  const [spotlight, setSpotlight] = useState<Product | null>(null);

  useEffect(() => {
    fetch("/api/products/featured")
      .then((r) => r.ok ? r.json() : { products: [] })
      .then((data) => {
        const products = data.products || [];
        if (products.length > 0) {
          setSpotlight(transformProduct(products[0]));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-surface via-dark to-dark" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_40%,rgba(232,136,58,0.06),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/[0.03] to-transparent -skew-x-12 origin-top-right" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left — Copy */}
          <div>
            <FadeIn>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
                {t("hero.newDropsBadge")}
              </span>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black text-foreground leading-[0.95] tracking-tight">
                {t("hero.headlinePart1")}{" "}
                <span className="italic text-primary">{t("hero.headlineAccent")}</span>
                <br />
                {t("hero.headlinePart2")}
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="mt-6 text-lg text-muted max-w-lg leading-relaxed">
                {t("hero.subheadline")}
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button href="/products" size="lg">
                  {t("hero.shopNow")}
                  <ArrowRight size={18} className="ml-2" />
                </Button>
                <Button
                  href="/categories/sneakers"
                  variant="outline"
                  size="lg"
                  className="border-border text-foreground hover:border-primary hover:text-primary"
                >
                  {t("hero.browseCategories")}
                </Button>
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="mt-14 flex items-center gap-8 text-sm">
                <div>
                  <span className="block text-3xl font-black text-foreground font-display">
                    {t("hero.productsCount")}
                  </span>
                  <span className="text-muted">{t("hero.productsLabel")}</span>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <span className="block text-3xl font-black text-foreground font-display">
                    {t("hero.brandsCount")}
                  </span>
                  <span className="text-muted">{t("hero.brandsLabel")}</span>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <span className="block text-3xl font-black text-foreground font-display">
                    {t("hero.customersCount")}
                  </span>
                  <span className="text-muted">{t("hero.customersLabel")}</span>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Right — Product Spotlight OR empty-state promo */}
          {!spotlight ? (
            <FadeIn delay={0.2} className="hidden lg:block">
              <Link href="/dashboard/selling" className="relative block group">
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-3xl blur-2xl" />
                <div className="relative bg-card border border-dashed border-primary/25 rounded-2xl overflow-hidden transition-all duration-500 group-hover:border-primary/50 group-hover:shadow-[0_16px_64px_rgba(232,136,58,0.08)]">
                  <div className="aspect-[4/3] bg-surface/50 flex flex-col items-center justify-center relative overflow-hidden p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232,136,58,0.06),transparent_70%)]" />
                    <div className="relative w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                      <Sparkles size={28} className="text-primary" />
                    </div>
                    <p className="relative text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
                      Premium Placement
                    </p>
                    <span className="absolute top-4 right-4 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-primary/90 text-white rounded-full z-10">
                      {t("common.featured")}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      Your product could be here
                    </h3>
                    <p className="text-sm text-muted mb-4 leading-relaxed">
                      Feature your listing on the VendFinder homepage and reach buyers across 9 markets worldwide.
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-border/60">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-emerald-400" />
                        <span className="text-[12px] text-muted">From $25/day</span>
                      </div>
                      <span className="text-[13px] font-bold text-primary group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                        Start featuring
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </FadeIn>
          ) : (
            <FadeIn delay={0.2} className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-3xl blur-2xl" />

                <Link
                  href={`/products/${spotlight.slug}`}
                  className="relative block group"
                >
                  <div className="bg-card border border-border rounded-2xl overflow-hidden transition-all duration-500 group-hover:border-primary/30 group-hover:shadow-[0_16px_64px_rgba(232,136,58,0.1)]">
                    <div className="aspect-[4/3] bg-surface flex items-center justify-center relative overflow-hidden">
                      {spotlight.images[0] ? (
                        <Image
                          src={spotlight.images[0]}
                          alt={spotlight.name}
                          fill
                          className="object-cover"
                          sizes="(min-width: 1024px) 50vw, 100vw"
                        />
                      ) : (
                        <Package
                          size={80}
                          className="text-border group-hover:text-muted transition-colors duration-500"
                        />
                      )}
                      {spotlight.compareAtPrice && (
                        <span className="absolute top-4 left-4 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-accent text-white rounded-full z-10">
                          {t("common.sale")}
                        </span>
                      )}
                      <span className="absolute top-4 right-4 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-primary/90 text-white rounded-full z-10">
                        {t("common.featured")}
                      </span>
                    </div>

                    <div className="p-6">
                      <p className="text-xs text-muted uppercase tracking-wider mb-2">
                        {spotlight.category}
                      </p>
                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {spotlight.name}
                      </h3>
                      {spotlight.description && (
                        <p className="text-sm text-muted mb-4 line-clamp-2">
                          {spotlight.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black text-foreground">
                            {formatPrice(spotlight.price)}
                          </span>
                          {spotlight.compareAtPrice && (
                            <span className="text-sm text-muted line-through">
                              {formatPrice(spotlight.compareAtPrice)}
                            </span>
                          )}
                        </div>
                        {spotlight.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star
                              size={14}
                              className="fill-primary text-primary"
                            />
                            <span className="text-sm font-semibold text-foreground">
                              {spotlight.rating}
                            </span>
                            <span className="text-xs text-muted">
                              ({spotlight.reviewCount})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </FadeIn>
          )}
        </div>
      </div>
    </section>
  );
}
