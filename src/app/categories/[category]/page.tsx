"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Layers, Package } from "lucide-react";
import { getCategoryBySlug } from "@/data/categories";
import { getProductsByCategory } from "@/data/products";
import ProductGrid from "@/components/product/ProductGrid";

export default function CategoryPage() {
  const params = useParams();
  const slug = params.category as string;
  const category = getCategoryBySlug(slug);
  const products = getProductsByCategory(slug);

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
          <Layers size={32} className="text-muted/30" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Category not found</h1>
        <p className="text-sm text-muted mb-6">The category you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-all"
        >
          Browse All Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <motion.nav
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-1.5 text-[12px] text-muted mb-8"
      >
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight size={12} className="text-muted/40" />
        <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
        <ChevronRight size={12} className="text-muted/40" />
        <span className="text-foreground font-medium">{category.name}</span>
      </motion.nav>

      {/* Category Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mb-10 relative overflow-hidden bg-card rounded-2xl border border-border p-8"
      >
        {/* Subtle gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.04] via-transparent to-violet-500/[0.03] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 24px, white 24px, white 25px)",
        }} />
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Layers size={18} className="text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {category.name}
            </h1>
          </div>
          <p className="text-sm text-muted max-w-md">{category.description}</p>
          <p className="text-[11px] text-muted mt-2">
            <span className="font-semibold text-foreground">{products.length}</span> products
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <ProductGrid products={products} />
      </motion.div>
    </div>
  );
}
