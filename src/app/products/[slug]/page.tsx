"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Package,
  Minus,
  Plus,
  ShoppingCart,
  Check,
  Star,
  Ruler,
  Shield,
  Truck,
  RotateCcw,
  Eye,
} from "lucide-react";
import { getProductBySlug, getProductsByCategory } from "@/data/products";
import { getReviewsByProductId } from "@/data/reviews";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Rating from "@/components/ui/Rating";
import ProductCard from "@/components/product/ProductCard";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const product = getProductBySlug(slug);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "description" | "specs" | "reviews"
  >("description");
  const { addItem } = useCart();

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
          <Package size={32} className="text-muted/30" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Product not found
        </h1>
        <p className="text-muted mb-6">
          The product you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-all"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  const reviews = getReviewsByProductId(product.id);
  const relatedProducts = getProductsByCategory(product.category)
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const hasSizes = product.sizes && product.sizes.length > 0;
  const isSneaker = product.category === "sneakers";

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    addItem(product, quantity, selectedSize || undefined);
  };

  const tabs = [
    { key: "description" as const, label: "Description" },
    { key: "specs" as const, label: "Specifications" },
    { key: "reviews" as const, label: `Reviews (${reviews.length})` },
  ];

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
        <Link href={`/categories/${product.category}`} className="hover:text-foreground transition-colors capitalize">
          {product.category.replace("-", " & ")}
        </Link>
        <ChevronRight size={12} className="text-muted/40" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
      </motion.nav>

      {/* Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="aspect-square bg-card rounded-2xl border border-border flex items-center justify-center relative overflow-hidden group">
            <Package size={80} className="text-muted/15" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(232,136,58,0.03),transparent_70%)]" />
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold">
            {product.category.replace("-", " & ")}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mt-3">
            <Rating value={product.rating} count={product.reviewCount} size="md" />
          </div>

          <div className="flex items-center gap-3 mt-5">
            <span className="text-3xl font-bold text-foreground">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && (
              <>
                <span className="text-lg text-muted line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-accent/10 text-accent">
                  {Math.round(
                    ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
                  )}% off
                </span>
              </>
            )}
          </div>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            {product.description}
          </p>

          {/* Size Selector */}
          {hasSizes && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] text-muted font-semibold uppercase tracking-wider flex items-center gap-2">
                  <Ruler size={13} className="text-muted/50" />
                  {isSneaker ? "Select Size (US)" : "Select Size"}
                </label>
                {isSneaker && (
                  <button className="text-[11px] text-primary hover:text-primary-dark font-semibold cursor-pointer transition-colors">
                    Size Guide
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {product.sizes!.map((size) => (
                  <button
                    key={size}
                    onClick={() => { setSelectedSize(size); setSizeError(false); }}
                    className={`
                      min-w-[48px] h-11 px-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer
                      ${selectedSize === size
                        ? "bg-primary/[0.08] text-primary border-primary/40 shadow-[0_0_12px_rgba(232,136,58,0.15)]"
                        : "bg-surface text-foreground border-border hover:border-border-hover"
                      }
                    `}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {sizeError && (
                <p className="mt-2 text-xs text-red-400 font-medium">
                  Please select a size before adding to cart
                </p>
              )}
            </div>
          )}

          {/* Features */}
          <div className="mt-6 space-y-2">
            {product.features.map((feature) => (
              <div key={feature} className="flex items-center gap-2.5 text-sm">
                <div className="w-5 h-5 rounded-md bg-emerald-400/10 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-emerald-400" />
                </div>
                <span className="text-foreground/80">{feature}</span>
              </div>
            ))}
          </div>

          {/* Quantity + Add to Cart */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3.5 py-3 text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
              >
                <Minus size={15} />
              </button>
              <span className="px-5 py-3 text-sm font-semibold border-x border-border min-w-[48px] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3.5 py-3 text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
              >
                <Plus size={15} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all cursor-pointer"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>
          </div>

          {/* Stock */}
          <p className="mt-4 text-sm">
            {product.inStock ? (
              <span className="text-emerald-400 font-medium">
                In Stock
                {product.stockCount && product.stockCount <= 10
                  ? ` — Only ${product.stockCount} left`
                  : ""}
              </span>
            ) : (
              <span className="text-red-400 font-medium">Out of Stock</span>
            )}
          </p>

          {/* Trust signals */}
          <div className="mt-6 flex items-center gap-5 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <Shield size={12} className="text-emerald-400" />
              Authenticity Guaranteed
            </span>
            <span className="flex items-center gap-1.5">
              <Truck size={12} className="text-blue-400" />
              Free Shipping
            </span>
            <span className="flex items-center gap-1.5">
              <RotateCcw size={12} className="text-amber-400" />
              Easy Returns
            </span>
          </div>

          <p className="mt-3 text-[11px] text-muted/50">SKU: {product.sku}</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex gap-1 mb-8 p-1 bg-surface/60 rounded-xl border border-border/60 w-fit backdrop-blur-sm"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-primary text-white shadow-[0_0_15px_rgba(232,136,58,0.15)]"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="mb-16"
      >
        <AnimatePresence mode="wait">
          {activeTab === "description" && (
            <motion.div key="desc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div className="bg-card rounded-2xl border border-border p-6 max-w-3xl">
                <p className="text-sm text-muted leading-relaxed">
                  {product.longDescription}
                </p>
              </div>
            </motion.div>
          )}
          {activeTab === "specs" && (
            <motion.div key="specs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div className="bg-card rounded-2xl border border-border overflow-hidden max-w-lg">
                {Object.entries(product.specifications).map(([key, value], i) => (
                  <div
                    key={key}
                    className={`flex justify-between px-5 py-3.5 text-sm ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
                  >
                    <span className="text-muted">{key}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {activeTab === "reviews" && (
            <motion.div key="reviews" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div className="space-y-4 max-w-2xl">
                {reviews.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-border py-12 text-center">
                    <Star size={24} className="mx-auto text-muted/30 mb-3" />
                    <p className="text-foreground font-medium">No reviews yet</p>
                    <p className="text-sm text-muted mt-1">Be the first to review this product.</p>
                  </div>
                ) : (
                  reviews.map((review, i) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="bg-card rounded-2xl border border-border p-5"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center text-foreground text-xs font-bold">
                          {review.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{review.userName}</span>
                            {review.verified && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="flex gap-0.5 mt-0.5">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star
                                key={j}
                                size={10}
                                className={j < review.rating ? "fill-amber-400 text-amber-400" : "text-white/[0.06]"}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <h4 className="text-sm font-semibold text-foreground mt-2">{review.title}</h4>
                      <p className="text-sm text-muted mt-1 leading-relaxed">{review.body}</p>
                      <p className="text-[11px] text-muted/50 mt-2">{review.date}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <h2 className="text-xl font-bold text-foreground mb-6">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
