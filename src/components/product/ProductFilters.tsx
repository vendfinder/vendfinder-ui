"use client";

import { X, SlidersHorizontal, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { categories } from "@/data/categories";
import { cn } from "@/lib/utils";

interface ProductFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onClear: () => void;
}

const sortOptionKeys = [
  { value: "relevance", key: "relevance" },
  { value: "price-asc", key: "priceLowHigh" },
  { value: "price-desc", key: "priceHighLow" },
  { value: "rating", key: "highestRated" },
  { value: "newest", key: "newest" },
] as const;

export default function ProductFilters({
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  onClear,
}: ProductFiltersProps) {
  const t = useTranslations("sort");
  const hasFilters = selectedCategory || sortBy !== "relevance";

  const sortOptions = sortOptionKeys.map((opt) => ({
    value: opt.value,
    label: t(opt.key),
  }));

  return (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <SlidersHorizontal size={12} />
          </div>
          <label className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold">
            {t("sortBy")}
          </label>
        </div>
        <div className="space-y-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className={cn(
                "block w-full text-left px-3 py-2 rounded-xl text-sm transition-all",
                sortBy === opt.value
                  ? "bg-primary/[0.08] text-primary font-semibold"
                  : "text-muted hover:bg-surface hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-violet-400/10 text-violet-400 flex items-center justify-center">
            <Layers size={12} />
          </div>
          <label className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold">
            {t("category")}
          </label>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => onCategoryChange("")}
            className={cn(
              "block w-full text-left px-3 py-2 rounded-xl text-sm transition-all",
              !selectedCategory
                ? "bg-primary/[0.08] text-primary font-semibold"
                : "text-muted hover:bg-surface hover:text-foreground"
            )}
          >
            {t("allCategories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => onCategoryChange(cat.slug)}
              className={cn(
                "flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-sm transition-all",
                selectedCategory === cat.slug
                  ? "bg-primary/[0.08] text-primary font-semibold"
                  : "text-muted hover:bg-surface hover:text-foreground"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold transition-colors"
        >
          <X size={12} />
          {t("clearFilters")}
        </button>
      )}
    </div>
  );
}
