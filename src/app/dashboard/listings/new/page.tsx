'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Camera,
  DollarSign,
  Tag,
  Package,
  Info,
  Plus,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Clock,
  Zap,
  ImagePlus,
  X,
  Loader2,
  Footprints,
  Smartphone,
  Shirt,
  Home,
  Watch,
  Trophy,
} from 'lucide-react';
import { categories } from '@/data/categories';
import { useAuth } from '@/context/AuthContext';
import {
  createProduct,
  createAsk,
  uploadProductImages,
} from '@/lib/api-products';
import { useTranslations } from 'next-intl';
import SizeChartModal from '@/components/product/SizeChartModal';
import SellerGate from '@/components/dashboard/SellerGate';

const sneakerSizes = [
  'US 4',
  'US 4.5',
  'US 5',
  'US 5.5',
  'US 6',
  'US 6.5',
  'US 7',
  'US 7.5',
  'US 8',
  'US 8.5',
  'US 9',
  'US 9.5',
  'US 10',
  'US 10.5',
  'US 11',
  'US 11.5',
  'US 12',
  'US 13',
  'US 14',
];
const clothingSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

const categoryIcons: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  sneakers: Footprints,
  electronics: Smartphone,
  apparel: Shirt,
  'home-living': Home,
  accessories: Watch,
  collectibles: Trophy,
};

export default function NewListingPage() {
  const router = useRouter();
  const t = useTranslations('newListing');
  const [step, setStep] = useState(1);
  const [duration, setDuration] = useState('30');
  const GLOBAL_LISTING_FEE = 2.99;
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    condition: 'new',
    sizes: [] as string[],
    askPrice: '',
    description: '',
    images: [] as string[],
  });

  const conditions = [
    {
      value: 'new',
      label: t('conditionNew'),
      description: t('conditionNewDesc'),
      icon: Sparkles,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
    },
    {
      value: 'used_like_new',
      label: t('conditionLikeNew'),
      description: t('conditionLikeNewDesc'),
      icon: ShieldCheck,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      value: 'used_good',
      label: t('conditionGood'),
      description: t('conditionGoodDesc'),
      icon: CheckCircle2,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
    },
    {
      value: 'used_fair',
      label: t('conditionFair'),
      description: t('conditionFairDesc'),
      icon: Info,
      color: 'text-muted',
      bgColor: 'bg-surface',
    },
  ];

  const stepInfo = [
    { num: 1, label: t('stepProductInfo'), icon: Package },
    { num: 2, label: t('stepConditionSize'), icon: Info },
    { num: 3, label: t('stepSetPrice'), icon: DollarSign },
  ];

  const showSizes =
    formData.category === 'sneakers' || formData.category === 'apparel';
  const sizeOptions =
    formData.category === 'sneakers' ? sneakerSizes : clothingSizes;

  const { token } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Photo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length || !token) return;

    const remaining = 8 - formData.images.length;
    const filesToUpload = selectedFiles.slice(0, remaining);

    // Show local previews immediately
    const newPreviews = filesToUpload.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);

    setUploading(true);
    try {
      const urls = await uploadProductImages(filesToUpload, token);
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch {
      // Remove previews for failed uploads
      setPreviews((prev) => prev.slice(0, prev.length - newPreviews.length));
      setError(t('failedToUploadImages'));
    } finally {
      setUploading(false);
      // Reset file input so re-selecting the same file works
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      // Create product first with all selected sizes
      const product = await createProduct(
        {
          name: formData.productName,
          description: formData.description || undefined,
          category: formData.category,
          retail_price: parseFloat(formData.askPrice),
          sizes: formData.sizes.length > 0 ? formData.sizes : undefined,
          image_url: formData.images[0] || undefined,
          media: formData.images.length
            ? formData.images.map((url) => ({ type: 'image', url }))
            : undefined,
          is_global_listing: true,
        },
        token
      );

      // Create one ask/listing per selected size (or single ask if no sizes)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(duration));

      if (formData.sizes.length > 0) {
        await Promise.all(
          formData.sizes.map((size) =>
            createAsk(
              product.id,
              {
                size,
                condition: formData.condition,
                ask_price: parseFloat(formData.askPrice),
                expires_at: expiresAt.toISOString(),
              },
              token
            )
          )
        );
      } else {
        await createAsk(
          product.id,
          {
            condition: formData.condition,
            ask_price: parseFloat(formData.askPrice),
            expires_at: expiresAt.toISOString(),
          },
          token
        );
      }

      router.push('/dashboard/selling');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create listing';
      setError(message);
      setSubmitting(false);
    }
  };

  const askNum = parseFloat(formData.askPrice) || 0;
  const sellerFee = askNum * 0.09;
  const processingFee = askNum * 0.03;
  const globalFee = GLOBAL_LISTING_FEE;
  const totalPayout = askNum - sellerFee - processingFee - globalFee;

  return (
    <SellerGate backHref="/dashboard/selling">
      <div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-8"
        >
          <Link
            href="/dashboard/selling"
            className="p-2.5 rounded-xl text-muted hover:text-foreground hover:bg-surface border border-transparent hover:border-border transition-all"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Tag size={15} className="text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {t('title')}
              </h1>
            </div>
            <p className="text-sm text-muted">{t('subtitle')}</p>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            {stepInfo.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <div key={s.num} className="flex items-center gap-3 flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (isDone) setStep(s.num);
                    }}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-[0_0_20px_rgba(232,136,58,0.15)]'
                        : isDone
                          ? 'bg-emerald-400/10 text-emerald-400 cursor-pointer hover:bg-emerald-400/15'
                          : 'bg-surface text-muted border border-border'
                    }`}
                  >
                    {isDone ? <CheckCircle2 size={15} /> : <Icon size={15} />}
                    <span className="text-sm font-semibold hidden sm:block">
                      {s.label}
                    </span>
                    <span className="text-sm font-bold sm:hidden">{s.num}</span>
                  </button>
                  {idx < 2 && (
                    <div
                      className={`flex-1 h-px ${isDone ? 'bg-emerald-400/40' : 'bg-border'} transition-colors`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="max-w-2xl">
          <AnimatePresence mode="wait">
            {/* ─── STEP 1: PRODUCT INFO ─── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Product Name */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-blue-400/10 text-blue-400 flex items-center justify-center">
                      <Package size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t('productDetails')}
                      </p>
                      <p className="text-[11px] text-muted">
                        {t('productDetailsDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                        {t('productName')}
                      </label>
                      <div className="relative">
                        <Tag
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40"
                        />
                        <input
                          value={formData.productName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              productName: e.target.value,
                            })
                          }
                          placeholder={t('productNamePlaceholder')}
                          className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                        {t('description')}{' '}
                        <span className="text-muted/40 normal-case">
                          ({t('optional')})
                        </span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder={t('descriptionPlaceholder')}
                        rows={3}
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-violet-400/10 text-violet-400 flex items-center justify-center">
                      <Zap size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t('category')}
                      </p>
                      <p className="text-[11px] text-muted">
                        {t('categoryDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categories.map((cat) => {
                      const CatIcon = categoryIcons[cat.slug] || Package;
                      const isSelected = formData.category === cat.slug;
                      return (
                        <button
                          key={cat.slug}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              category: cat.slug,
                              sizes: [],
                            })
                          }
                          className={`p-4 rounded-xl border text-left transition-all group ${
                            isSelected
                              ? 'border-primary/40 bg-primary/[0.06] shadow-[0_0_15px_rgba(232,136,58,0.08)]'
                              : 'border-border bg-surface hover:border-border-hover hover:bg-surface/80'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 transition-colors ${
                              isSelected
                                ? 'bg-primary/15 text-primary'
                                : 'bg-white/[0.04] text-muted group-hover:text-foreground'
                            }`}
                          >
                            <CatIcon size={16} />
                          </div>
                          <p
                            className={`text-sm font-semibold transition-colors ${isSelected ? 'text-primary' : 'text-foreground'}`}
                          >
                            {cat.name}
                          </p>
                          <p className="text-[10px] text-muted mt-0.5">
                            {cat.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Photos */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-rose-400/10 text-rose-400 flex items-center justify-center">
                      <ImagePlus size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t('photos')}
                      </p>
                      <p className="text-[11px] text-muted">
                        {t('photosDesc')}
                      </p>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div className="grid grid-cols-4 gap-3">
                    {/* Uploaded / previewing images */}
                    {previews.map((src, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-xl border border-border bg-surface relative overflow-hidden group"
                      >
                        <img
                          src={formData.images[i] || src}
                          alt={`Photo ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Uploading overlay */}
                        {!formData.images[i] && uploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2
                              size={20}
                              className="text-white animate-spin"
                            />
                          </div>
                        )}
                        {/* Remove button */}
                        {formData.images[i] && (
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        )}
                        {/* Cover badge */}
                        {i === 0 && (
                          <span className="absolute bottom-1.5 left-1.5 text-[8px] font-bold uppercase tracking-wider bg-primary/90 text-white px-1.5 py-0.5 rounded">
                            {t('cover')}
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Add Photo button (if under 8) */}
                    {formData.images.length < 8 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="aspect-square rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/[0.03] flex flex-col items-center justify-center gap-1.5 text-primary hover:bg-primary/[0.06] transition-all disabled:opacity-40"
                      >
                        {uploading ? (
                          <Loader2 size={22} className="animate-spin" />
                        ) : (
                          <Camera size={22} />
                        )}
                        <span className="text-[9px] font-bold uppercase tracking-wider">
                          {t('addPhoto')}
                        </span>
                      </button>
                    )}

                    {/* Empty placeholder slots */}
                    {Array.from({
                      length: Math.max(0, 3 - previews.length),
                    }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border border-border bg-surface/50 flex items-center justify-center text-muted/20 hover:border-border-hover transition-colors cursor-pointer"
                      >
                        <Plus size={16} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Continue */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!formData.productName || !formData.category}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {t('continue')}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 2: CONDITION & SIZE ─── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Condition */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center">
                      <ShieldCheck size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t('conditionTitle')}
                      </p>
                      <p className="text-[11px] text-muted">
                        {t('conditionDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {conditions.map((c) => {
                      const Icon = c.icon;
                      const isSelected = formData.condition === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, condition: c.value })
                          }
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-primary/40 bg-primary/[0.06] shadow-[0_0_15px_rgba(232,136,58,0.08)]'
                              : 'border-border bg-surface hover:border-border-hover'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-primary/15 text-primary'
                                : `${c.bgColor} ${c.color}`
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}
                            >
                              {c.label}
                            </p>
                            <p className="text-[11px] text-muted mt-0.5">
                              {c.description}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2
                              size={18}
                              className="text-primary shrink-0"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size */}
                {showSizes && (
                  <div className="bg-card rounded-2xl border border-border p-5">
                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="w-9 h-9 rounded-xl bg-blue-400/10 text-blue-400 flex items-center justify-center">
                        {formData.category === 'sneakers' ? (
                          <Footprints size={15} />
                        ) : (
                          <Shirt size={15} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-foreground">
                            {t('sizeTitle')}
                          </p>
                          {formData.category === 'sneakers' && (
                            <button
                              type="button"
                              onClick={() => setShowSizeChart(true)}
                              className="text-[11px] text-primary hover:text-primary-dark font-semibold cursor-pointer transition-colors"
                            >
                              {t('sizeGuide')}
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-muted">
                          {t('sizeDesc')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] text-muted">
                        {formData.sizes.length === 0
                          ? 'Tap sizes to select (multi-select)'
                          : `${formData.sizes.length} size${formData.sizes.length > 1 ? 's' : ''} selected`}
                      </p>
                      {formData.sizes.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, sizes: [] })
                          }
                          className="text-[11px] text-muted hover:text-foreground transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, sizes: [...sizeOptions] })
                        }
                        className="px-3.5 py-2 rounded-xl border border-primary/30 bg-primary/5 text-primary text-[11px] font-bold hover:bg-primary/10 transition-all"
                      >
                        Select all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sizeOptions.map((size) => {
                        const isSelected = formData.sizes.includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                sizes: isSelected
                                  ? formData.sizes.filter((s) => s !== size)
                                  : [...formData.sizes, size],
                              });
                            }}
                            className={`px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                              isSelected
                                ? 'border-primary/40 bg-primary/[0.08] text-primary shadow-[0_0_10px_rgba(232,136,58,0.08)]'
                                : 'border-border bg-surface text-foreground hover:border-border-hover'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-3 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface transition-all"
                  >
                    {t('back')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all"
                  >
                    {t('continue')}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 3: SET PRICE ─── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Price Input */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center">
                      <DollarSign size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t('setYourAskPrice')}
                      </p>
                      <p className="text-[11px] text-muted">
                        {t('setYourAskPriceDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="relative mb-5">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/40 font-bold text-xl">
                      $
                    </span>
                    <input
                      type="number"
                      value={formData.askPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, askPrice: e.target.value })
                      }
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-5 bg-surface border border-border rounded-xl text-foreground text-3xl font-bold placeholder:text-muted/20 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  {/* Market Data */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        label: t('marketLowestAsk'),
                        value: '$—',
                        color: 'text-emerald-400',
                      },
                      {
                        label: t('marketHighestBid'),
                        value: '$—',
                        color: 'text-blue-400',
                      },
                      {
                        label: t('marketLastSale'),
                        value: '$—',
                        color: 'text-foreground',
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="bg-surface rounded-xl border border-border p-3 text-center"
                      >
                        <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">
                          {item.label}
                        </p>
                        <p className={`text-sm font-bold ${item.color}`}>
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payout Summary */}
                <AnimatePresence>
                  {askNum > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-card rounded-2xl border border-emerald-400/15 p-5">
                        <div className="flex items-center gap-2.5 mb-4">
                          <div className="w-9 h-9 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 size={15} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {t('payoutSummary')}
                            </p>
                            <p className="text-[11px] text-muted">
                              {t('payoutSummaryDesc')}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted">
                              {t('salePrice')}
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                              ${askNum.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted">
                              {t('sellerFee')}
                            </span>
                            <span className="text-sm font-semibold text-red-400">
                              -${sellerFee.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted">
                              {t('paymentProcessing')}
                            </span>
                            <span className="text-sm font-semibold text-red-400">
                              -${processingFee.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted">
                              {t('globalListingFeeLabel')}
                            </span>
                            <span className="text-sm font-semibold text-red-400">
                              -${globalFee.toFixed(2)}
                            </span>
                          </div>
                          <div className="border-t border-white/[0.06] pt-3 mt-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-foreground">
                                {t('totalPayout')}
                              </span>
                              <span className="text-lg font-bold text-emerald-400">
                                ${totalPayout.toFixed(2)}
                              </span>
                            </div>
                            {/* Payout bar */}
                            <div className="w-full h-2 rounded-full bg-white/[0.04] mt-3 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '88%' }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                              />
                            </div>
                            <p className="text-[10px] text-muted mt-1.5">
                              {t('youKeepPercent')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Duration */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
                      <Clock size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t('listingDuration')}
                      </p>
                      <p className="text-[11px] text-muted">
                        {t('listingDurationDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: '30', label: t('duration30Days') },
                      { value: '60', label: t('duration60Days') },
                      { value: '90', label: t('duration90Days') },
                    ].map((dur) => (
                      <button
                        key={dur.value}
                        type="button"
                        onClick={() => setDuration(dur.value)}
                        className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                          duration === dur.value
                            ? 'border-primary/40 bg-primary/[0.06] text-primary shadow-[0_0_10px_rgba(232,136,58,0.08)]'
                            : 'border-border bg-surface text-foreground hover:border-border-hover'
                        }`}
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Listing Preview */}
                <div className="bg-card rounded-2xl border border-primary/20 p-5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] to-transparent pointer-events-none" />
                  <div className="relative">
                    <p className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold mb-3">
                      {t('listingPreview')}
                    </p>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-surface border border-border flex items-center justify-center text-muted/30 shrink-0 overflow-hidden">
                        {formData.images[0] ? (
                          <img
                            src={formData.images[0]}
                            alt="Cover"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={22} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {formData.productName || t('productNameDefault')}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {formData.category && (
                            <span className="text-[10px] bg-surface px-2 py-0.5 rounded-lg text-muted capitalize border border-border">
                              {formData.category.replace('-', ' ')}
                            </span>
                          )}
                          {formData.sizes.length > 0 && (
                            <span className="text-[10px] bg-surface px-2 py-0.5 rounded-lg text-muted border border-border">
                              {formData.sizes.length === 1
                                ? formData.sizes[0]
                                : `${formData.sizes.length} sizes`}
                            </span>
                          )}
                          <span className="text-[10px] bg-surface px-2 py-0.5 rounded-lg text-muted capitalize border border-border">
                            {
                              conditions.find(
                                (c) => c.value === formData.condition
                              )?.label
                            }
                          </span>
                          <span className="text-[10px] bg-surface px-2 py-0.5 rounded-lg text-muted border border-border">
                            {t('durationDays', { count: duration })}
                          </span>
                        </div>
                        {askNum > 0 && (
                          <p className="text-xl font-bold text-primary mt-2.5">
                            ${askNum.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                    {error}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-3 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface transition-all"
                  >
                    {t('back')}
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.askPrice || submitting}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <Tag size={14} />
                    {submitting ? t('creating') : t('listItem')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <SizeChartModal
          open={showSizeChart}
          onClose={() => setShowSizeChart(false)}
        />
      </div>
    </SellerGate>
  );
}
