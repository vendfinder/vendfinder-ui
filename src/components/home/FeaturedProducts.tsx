"use client";

import { useRef, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import Button from "@/components/ui/Button";
import { FadeIn } from "@/components/motion/MotionWrapper";
import { transformProduct } from "@/lib/api";

export default function FeaturedProducts({ storiesBar }: { storiesBar?: React.ReactNode }) {
  const t = useTranslations("featured");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/products/featured")
      .then((r) => r.ok ? r.json() : { products: [] })
      .then((data) => {
        const products = (data.products || []).map(transformProduct);
        setFeatured(products);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  // Always render stories bar; only render featured section if there are paid slots
  if (!loaded || featured.length === 0) {
    return storiesBar ? (
      <section className="py-12 bg-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {storiesBar}
        </div>
      </section>
    ) : null;
  }

  return (
    <section className="py-16 lg:py-24 bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {storiesBar && <div className="mb-10">{storiesBar}</div>}
        <FadeIn>
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">
                {t("popularNow")}
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground tracking-tight">
                {t("trendingProducts")}
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={() => scroll("left")}
                className="w-10 h-10 rounded-full border border-border text-muted hover:text-primary hover:border-primary transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Scroll left"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scroll("right")}
                className="w-10 h-10 rounded-full border border-border text-muted hover:text-primary hover:border-primary transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Scroll right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </FadeIn>

        <div
          ref={scrollRef}
          className="flex gap-4 lg:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 snap-x snap-mandatory"
        >
          {featured.map((product) => (
            <div
              key={product.id}
              className="flex-none w-[260px] sm:w-[280px] snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button href="/products" variant="outline" className="border-border text-foreground hover:border-primary hover:text-primary">
            {t("viewAllProducts")} <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
