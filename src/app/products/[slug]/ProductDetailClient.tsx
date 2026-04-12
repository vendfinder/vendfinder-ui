'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
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
  Lock,
  BadgeCheck,
  MessageCircle,
  Loader2,
  Send,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Product, Review } from '@/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import Rating from '@/components/ui/Rating';
import ProductCard from '@/components/product/ProductCard';
import SizeChartModal from '@/components/product/SizeChartModal';
import ConditionBadge, {
  type ConditionValue,
} from '@/components/product/ConditionBadge';
import ConditionGuide from '@/components/product/ConditionGuide';
import { createReview } from '@/lib/api-products';
import PriceHistoryChart from '@/components/product/PriceHistoryChart';
import SalesHistoryTable from '@/components/product/SalesHistoryTable';
import { useTranslatedProduct } from '@/hooks/useTranslatedProduct';
import ReportDialog from '@/components/ui/ReportDialog';
import { Flag } from 'lucide-react';

export default function ProductDetailClient({
  product: rawProduct,
  reviews,
  relatedProducts,
  sizeAvailability = {},
  askConditions = [],
}: {
  product: Product;
  reviews: Review[];
  relatedProducts: Product[];
  sizeAvailability?: Record<string, number>;
  askConditions?: string[];
}) {
  const product = useTranslatedProduct(rawProduct);
  const t = useTranslations('product');
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'description' | 'specs' | 'market' | 'reviews'
  >('description');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [allReviews, setAllReviews] = useState(reviews);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [showConditionGuide, setShowConditionGuide] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const { addItem } = useCart();
  const { isAuthenticated, user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/products/${product.id}/view`, { method: 'POST' }).catch(
      () => {}
    );
  }, [product.id]);

  const handleSubmitReview = async () => {
    if (!token || !user) return;
    if (reviewRating === 0) {
      setReviewError('Please select a rating');
      return;
    }
    if (!reviewTitle.trim()) {
      setReviewError('Please add a title');
      return;
    }
    if (!reviewBody.trim()) {
      setReviewError('Please add a review');
      return;
    }

    setReviewSubmitting(true);
    setReviewError('');
    try {
      await createReview(
        {
          vendor_id: product.sellerId || product.id,
          user_id: user.id,
          product_id: product.id,
          rating: reviewRating,
          title: reviewTitle.trim(),
          content: reviewBody.trim(),
          author_name: user.name || user.username || 'Anonymous',
        },
        token
      );
      setReviewSuccess(true);
      setShowReviewForm(false);
      setAllReviews((prev) => [
        {
          id: crypto.randomUUID(),
          productId: product.id,
          userName: user.name || user.username || 'Anonymous',
          rating: reviewRating,
          title: reviewTitle.trim(),
          body: reviewBody.trim(),
          date: new Date().toLocaleDateString(),
          verified: false,
        },
        ...prev,
      ]);
      setReviewRating(0);
      setReviewTitle('');
      setReviewBody('');
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : 'Failed to submit review'
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const sneakerSizes = [
    '3.5',
    '4',
    '4.5',
    '5',
    '5.5',
    '6',
    '6.5',
    '7',
    '7.5',
    '8',
    '8.5',
    '9',
    '9.5',
    '10',
    '10.5',
    '11',
    '11.5',
    '12',
    '12.5',
    '13',
    '14',
    '15',
    '16',
  ];
  const isSneaker = product.category === 'sneakers';
  const displaySizes =
    product.sizes && product.sizes.length > 0
      ? product.sizes
      : isSneaker
        ? sneakerSizes
        : null;
  const hasSizes = displaySizes !== null;

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    addItem(product, quantity, selectedSize || undefined);
  };

  const tabs = [
    { key: 'description' as const, label: t('description') },
    { key: 'specs' as const, label: t('specifications') },
    { key: 'market' as const, label: t('marketData') },
    {
      key: 'reviews' as const,
      label: `${t('reviews')} (${allReviews.length})`,
    },
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
        <Link href="/" className="hover:text-foreground transition-colors">
          {t('home')}
        </Link>
        <ChevronRight size={12} className="text-muted/40" />
        <Link
          href="/products"
          className="hover:text-foreground transition-colors"
        >
          {t('products')}
        </Link>
        <ChevronRight size={12} className="text-muted/40" />
        <Link
          href={`/categories/${product.category}`}
          className="hover:text-foreground transition-colors capitalize"
        >
          {product.category.replace('-', ' & ')}
        </Link>
        <ChevronRight size={12} className="text-muted/40" />
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {product.name}
        </span>
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
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <Package size={80} className="text-muted/15" />
            )}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(232,136,58,0.03),transparent_70%)]" />
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold">
                {product.category.replace('-', ' & ')}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
                {product.name}
              </h1>
            </div>
            {isAuthenticated && (
              <button
                onClick={() => setShowReportDialog(true)}
                className="shrink-0 p-2 rounded-lg text-muted/40 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                title="Report this listing"
              >
                <Flag size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 mt-3">
            <Rating
              value={
                allReviews.length > 0
                  ? allReviews.reduce((sum, r) => sum + r.rating, 0) /
                    allReviews.length
                  : product.rating
              }
              count={allReviews.length || product.reviewCount}
              size="md"
            />
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
                    ((product.compareAtPrice - product.price) /
                      product.compareAtPrice) *
                      100
                  )}
                  % {t('off')}
                </span>
              </>
            )}
          </div>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            {product.description}
          </p>

          {/* Condition Badge(s) */}
          {(() => {
            const validConditions: ConditionValue[] = [
              'new',
              'used_like_new',
              'used_good',
              'used_fair',
            ];
            const displayConditions =
              askConditions.length > 0
                ? askConditions.filter((c): c is ConditionValue =>
                    validConditions.includes(c as ConditionValue)
                  )
                : ['new' as ConditionValue];

            return displayConditions.length > 0 ? (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-[11px] text-muted font-semibold uppercase tracking-wider flex items-center gap-2">
                    <Shield size={13} className="text-muted/50" />
                    {t('condition')}
                  </label>
                  <button
                    onClick={() => setShowConditionGuide(true)}
                    className="text-[11px] text-primary hover:text-primary-dark font-semibold cursor-pointer transition-colors"
                  >
                    {t('conditionGuide')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {displayConditions.map((cond) => (
                    <ConditionBadge
                      key={cond}
                      condition={cond}
                      size="md"
                      showTooltip
                    />
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Size Selector */}
          {hasSizes && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] text-muted font-semibold uppercase tracking-wider flex items-center gap-2">
                  <Ruler size={13} className="text-muted/50" />
                  {isSneaker ? t('selectSizeUS') : t('selectSize')}
                </label>
                {isSneaker && (
                  <button
                    onClick={() => setShowSizeChart(true)}
                    className="text-[11px] text-primary hover:text-primary-dark font-semibold cursor-pointer transition-colors"
                  >
                    {t('sizeGuide')}
                  </button>
                )}
              </div>

              {hasSizes && (
                <div className="flex flex-wrap gap-2">
                  {displaySizes!.map((size) => {
                    const hasAsks = Object.keys(sizeAvailability).length > 0;
                    const isAvailable =
                      !hasAsks ||
                      size in sizeAvailability ||
                      'one-size' in sizeAvailability;
                    const lowestAsk =
                      sizeAvailability[size] || sizeAvailability['one-size'];

                    return (
                      <button
                        key={size}
                        onClick={() => {
                          if (!isAvailable) return;
                          setSelectedSize(size);
                          setSizeError(false);
                        }}
                        disabled={!isAvailable}
                        className={`
                          min-w-[56px] px-3 py-2 rounded-xl border transition-all flex flex-col items-center gap-0.5
                          ${
                            !isAvailable
                              ? 'bg-surface/30 text-muted/30 border-border/30 cursor-not-allowed line-through decoration-muted/20'
                              : selectedSize === size
                                ? 'bg-primary/[0.08] text-primary border-primary/40 shadow-[0_0_12px_rgba(232,136,58,0.15)] cursor-pointer'
                                : 'bg-surface text-foreground border-border hover:border-border-hover cursor-pointer'
                          }
                        `}
                      >
                        <span className="text-sm font-semibold">{size}</span>
                        {hasAsks && isAvailable && lowestAsk && (
                          <span className="text-[10px] text-muted font-medium">
                            ${lowestAsk}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {sizeError && (
                <p className="mt-2 text-xs text-red-400 font-medium">
                  {t('selectSizeError')}
                </p>
              )}
            </div>
          )}

          {/* Features */}
          {product.features.length > 0 && (
            <div className="mt-6 space-y-2">
              {product.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2.5 text-sm"
                >
                  <div className="w-5 h-5 rounded-md bg-emerald-400/10 flex items-center justify-center shrink-0">
                    <Check size={11} className="text-emerald-400" />
                  </div>
                  <span className="text-foreground/80">{feature}</span>
                </div>
              ))}
            </div>
          )}

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
              {t('addToCart')}
            </button>
          </div>

          {/* Message Seller */}
          {isAuthenticated && (
            <button
              onClick={() =>
                router.push(
                  `/dashboard/messages?product=${product.id}${product.sellerId ? `&seller=${product.sellerId}` : ''}`
                )
              }
              className="mt-3 w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface border border-border text-foreground font-semibold rounded-xl hover:border-primary/40 hover:text-primary transition-all cursor-pointer text-sm"
            >
              <MessageCircle size={15} />
              {t('messageSeller')}
            </button>
          )}

          {/* Stock */}
          <p className="mt-4 text-sm">
            {product.inStock ? (
              <span className="text-emerald-400 font-medium">
                {t('inStock')}
                {product.stockCount && product.stockCount <= 10
                  ? ` — ${t('onlyLeft', { count: product.stockCount })}`
                  : ''}
              </span>
            ) : (
              <span className="text-red-400 font-medium">
                {t('outOfStock')}
              </span>
            )}
          </p>

          {/* Trust signals */}
          <div className="mt-6 flex items-center gap-5 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <BadgeCheck size={12} className="text-emerald-400" />
              {t('trustVerified')}
            </span>
            <span className="flex items-center gap-1.5">
              <Lock size={12} className="text-blue-400" />
              {t('trustEscrow')}
            </span>
            <span className="flex items-center gap-1.5">
              <Shield size={12} className="text-amber-400" />
              {t('trustBuyerProtection')}
            </span>
          </div>

          <p className="mt-3 text-[11px] text-muted/50">
            {t('sku')}: {product.sku}
          </p>
        </motion.div>
      </div>

      {/* Price History & Sales */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="mb-16 space-y-6"
      >
        <PriceHistoryChart productId={product.id} selectedSize={selectedSize} />
        <SalesHistoryTable productId={product.id} selectedSize={selectedSize} />
      </motion.div>

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
                ? 'bg-primary text-white shadow-[0_0_15px_rgba(232,136,58,0.15)]'
                : 'text-muted hover:text-foreground'
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
          {activeTab === 'description' && (
            <motion.div
              key="desc"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="bg-card rounded-2xl border border-border p-6 max-w-3xl">
                <p className="text-sm text-muted leading-relaxed">
                  {product.longDescription}
                </p>
              </div>
            </motion.div>
          )}
          {activeTab === 'specs' && (
            <motion.div
              key="specs"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="bg-card rounded-2xl border border-border overflow-hidden max-w-lg">
                {Object.entries(product.specifications).length > 0 ? (
                  Object.entries(product.specifications).map(
                    ([key, value], i) => (
                      <div
                        key={key}
                        className={`flex justify-between px-5 py-3.5 text-sm ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}
                      >
                        <span className="text-muted">{key}</span>
                        <span className="font-medium text-foreground">
                          {value}
                        </span>
                      </div>
                    )
                  )
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-muted">
                    {t('noSpecifications')}
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {activeTab === 'market' && (
            <motion.div
              key="market"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="space-y-8 max-w-4xl">
                <PriceHistoryChart
                  productId={product.id}
                  selectedSize={selectedSize}
                />
                <SalesHistoryTable
                  productId={product.id}
                  selectedSize={selectedSize}
                />
              </div>
            </motion.div>
          )}
          {activeTab === 'reviews' && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="space-y-4 max-w-2xl">
                {/* Write Review Button / Form */}
                {isAuthenticated && !reviewSuccess && (
                  <>
                    {!showReviewForm ? (
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all"
                      >
                        <Star size={15} />
                        {t('writeReview')}
                      </button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card rounded-2xl border border-border p-5 space-y-4"
                      >
                        <h4 className="text-sm font-bold text-foreground">
                          {t('writeYourReview')}
                        </h4>

                        {/* Star Rating Picker */}
                        <div>
                          <p className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-2">
                            {t('yourRating')}
                          </p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onMouseEnter={() => setReviewHoverRating(star)}
                                onMouseLeave={() => setReviewHoverRating(0)}
                                onClick={() => setReviewRating(star)}
                                className="p-0.5 transition-transform hover:scale-110"
                              >
                                <Star
                                  size={24}
                                  className={
                                    star <= (reviewHoverRating || reviewRating)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-white/[0.1]'
                                  }
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Title */}
                        <div>
                          <p className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-2">
                            {t('reviewTitle')}
                          </p>
                          <input
                            value={reviewTitle}
                            onChange={(e) => setReviewTitle(e.target.value)}
                            placeholder={t('reviewTitlePlaceholder')}
                            maxLength={200}
                            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-foreground text-sm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                          />
                        </div>

                        {/* Body */}
                        <div>
                          <p className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-2">
                            {t('review')}
                          </p>
                          <textarea
                            value={reviewBody}
                            onChange={(e) => setReviewBody(e.target.value)}
                            placeholder={t('reviewPlaceholder')}
                            rows={4}
                            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-foreground text-sm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                          />
                        </div>

                        {reviewError && (
                          <p className="text-xs text-error font-medium">
                            {reviewError}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleSubmitReview}
                            disabled={reviewSubmitting}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all text-sm disabled:opacity-60"
                          >
                            {reviewSubmitting ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Send size={14} />
                            )}
                            {t('submitReview')}
                          </button>
                          <button
                            onClick={() => {
                              setShowReviewForm(false);
                              setReviewError('');
                            }}
                            className="px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground transition-colors"
                          >
                            {t('cancel')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}

                {reviewSuccess && (
                  <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-2xl p-4 text-center">
                    <Check
                      size={20}
                      className="mx-auto text-emerald-400 mb-1"
                    />
                    <p className="text-sm font-medium text-emerald-400">
                      {t('reviewSubmitted')}
                    </p>
                  </div>
                )}

                {/* Review List */}
                {allReviews.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-border py-12 text-center">
                    <Star size={24} className="mx-auto text-muted/30 mb-3" />
                    <p className="text-foreground font-medium">
                      {t('noReviewsYet')}
                    </p>
                    <p className="text-sm text-muted mt-1">
                      {t('beFirstToReview')}
                    </p>
                  </div>
                ) : (
                  allReviews.map((review, i) => (
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
                            <span className="text-sm font-semibold text-foreground">
                              {review.userName}
                            </span>
                            {review.verified && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400">
                                {t('verified')}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-0.5 mt-0.5">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star
                                key={j}
                                size={10}
                                className={
                                  j < review.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-white/[0.06]'
                                }
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <h4 className="text-sm font-semibold text-foreground mt-2">
                        {review.title}
                      </h4>
                      <p className="text-sm text-muted mt-1 leading-relaxed">
                        {review.body}
                      </p>
                      <p className="text-[11px] text-muted/50 mt-2">
                        {review.date}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <SizeChartModal
        open={showSizeChart}
        onClose={() => setShowSizeChart(false)}
      />
      <ConditionGuide
        open={showConditionGuide}
        onClose={() => setShowConditionGuide(false)}
      />
      {showReportDialog && (
        <ReportDialog
          targetType="product"
          targetId={product.id}
          targetLabel={product.name}
          onClose={() => setShowReportDialog(false)}
        />
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <h2 className="text-xl font-bold text-foreground mb-6">
            {t('youMayAlsoLike')}
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
