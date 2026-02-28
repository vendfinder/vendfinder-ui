"use client";

import { useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { getTrendingProducts } from "@/data/products";
import ProductCard from "@/components/product/ProductCard";
import Button from "@/components/ui/Button";
import { FadeIn } from "@/components/motion/MotionWrapper";

export default function FeaturedProducts() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trending = getTrendingProducts();

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-16 lg:py-24 bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">
                Popular right now
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground tracking-tight">
                Trending Products
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

        {/* Horizontal scroll */}
        <div
          ref={scrollRef}
          className="flex gap-4 lg:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 snap-x snap-mandatory"
        >
          {trending.map((product) => (
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
            View All Products <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
