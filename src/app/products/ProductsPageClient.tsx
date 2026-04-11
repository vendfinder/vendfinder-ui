"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { SlidersHorizontal, X, ShoppingBag } from "lucide-react";
import type { Product } from "@/types";
import SearchBar from "@/components/ui/SearchBar";
import ProductGrid from "@/components/product/ProductGrid";
import ProductFilters from "@/components/product/ProductFilters";

export default function ProductsPageClient({
  products,
}: {
  products: Product[];
}) {
  const t = useTranslations("productsPage");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = [...products];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q))
      );
    }

    if (category) {
      result = result.filter((p) => p.category === category);
    }

    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return result;
  }, [products, search, category, sortBy]);

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setSortBy("relevance");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShoppingBag size={15} className="text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t("title")}
          </h1>
        </div>
        <p className="text-sm text-muted">
          {t("showingOf", { shown: filtered.length, total: products.length })}
        </p>
      </motion.div>

      {/* Search + Filter Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="flex gap-3 mb-8"
      >
        <SearchBar
          value={search}
          onChange={setSearch}
          className="flex-1"
          placeholder={t("searchPlaceholder")}
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-muted hover:text-foreground hover:border-border-hover transition-all"
        >
          {showFilters ? <X size={16} /> : <SlidersHorizontal size={16} />}
          {t("filters")}
        </button>
      </motion.div>

      <div className="flex gap-8">
        {/* Sidebar Filters - Desktop */}
        <motion.aside
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="hidden lg:block w-60 flex-shrink-0"
        >
          <div className="sticky top-24 bg-card rounded-2xl border border-border p-4">
            <ProductFilters
              selectedCategory={category}
              onCategoryChange={setCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onClear={clearFilters}
            />
          </div>
        </motion.aside>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowFilters(false)}
            />
            <div className="fixed left-0 top-0 h-full w-72 bg-card border-r border-border p-6 shadow-2xl overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground">{t("filters")}</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <ProductFilters
                selectedCategory={category}
                onCategoryChange={(c) => {
                  setCategory(c);
                  setShowFilters(false);
                }}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onClear={clearFilters}
              />
            </div>
          </div>
        )}

        {/* Product Grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex-1"
        >
          <ProductGrid products={filtered} />
        </motion.div>
      </div>
    </div>
  );
}
