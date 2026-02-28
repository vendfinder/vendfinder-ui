"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Camera,
  DollarSign,
  Tag,
  Package,
  Info,
  Plus,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Clock,
  Zap,
  ImagePlus,
  Footprints,
  Smartphone,
  Shirt,
  Home,
  Watch,
  Trophy,
} from "lucide-react";
import { categories } from "@/data/categories";

const conditions = [
  { value: "new", label: "New / Deadstock", description: "Brand new, never worn or used", icon: Sparkles, color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
  { value: "used_like_new", label: "Used - Like New", description: "Worn once or twice, no visible wear", icon: ShieldCheck, color: "text-blue-400", bgColor: "bg-blue-400/10" },
  { value: "used_good", label: "Used - Good", description: "Light signs of wear, fully functional", icon: CheckCircle2, color: "text-amber-400", bgColor: "bg-amber-400/10" },
  { value: "used_fair", label: "Used - Fair", description: "Visible wear, still fully functional", icon: Info, color: "text-muted", bgColor: "bg-surface" },
];

const sneakerSizes = ["US 4", "US 4.5", "US 5", "US 5.5", "US 6", "US 6.5", "US 7", "US 7.5", "US 8", "US 8.5", "US 9", "US 9.5", "US 10", "US 10.5", "US 11", "US 11.5", "US 12", "US 13", "US 14"];
const clothingSizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

const categoryIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  sneakers: Footprints,
  electronics: Smartphone,
  streetwear: Shirt,
  "home-living": Home,
  accessories: Watch,
  collectibles: Trophy,
};

const stepInfo = [
  { num: 1, label: "Product Info", icon: Package },
  { num: 2, label: "Condition & Size", icon: Info },
  { num: 3, label: "Set Price", icon: DollarSign },
];

export default function NewListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [duration, setDuration] = useState("30");
  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    condition: "new",
    size: "",
    askPrice: "",
    description: "",
    images: [] as string[],
  });

  const showSizes = formData.category === "sneakers" || formData.category === "streetwear";
  const sizeOptions = formData.category === "sneakers" ? sneakerSizes : clothingSizes;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard/selling");
  };

  const askNum = parseFloat(formData.askPrice) || 0;
  const sellerFee = askNum * 0.09;
  const processingFee = askNum * 0.03;
  const totalPayout = askNum - sellerFee - processingFee;

  return (
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
            <h1 className="text-2xl font-bold text-foreground">Create Listing</h1>
          </div>
          <p className="text-sm text-muted">List an item for sale on VendFinder</p>
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
                  onClick={() => { if (isDone) setStep(s.num); }}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-[0_0_20px_rgba(232,136,58,0.15)]"
                      : isDone
                        ? "bg-emerald-400/10 text-emerald-400 cursor-pointer hover:bg-emerald-400/15"
                        : "bg-surface text-muted border border-border"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <Icon size={15} />
                  )}
                  <span className="text-sm font-semibold hidden sm:block">{s.label}</span>
                  <span className="text-sm font-bold sm:hidden">{s.num}</span>
                </button>
                {idx < 2 && (
                  <div className={`flex-1 h-px ${isDone ? "bg-emerald-400/40" : "bg-border"} transition-colors`} />
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
                    <p className="text-sm font-semibold text-foreground">Product Details</p>
                    <p className="text-[11px] text-muted">Name your item and add a description</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                      Product Name
                    </label>
                    <div className="relative">
                      <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
                      <input
                        value={formData.productName}
                        onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                        placeholder="e.g. Air Jordan 4 Retro Bred"
                        className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                      Description <span className="text-muted/40 normal-case">(optional)</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Add any additional details about your item..."
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
                    <p className="text-sm font-semibold text-foreground">Category</p>
                    <p className="text-[11px] text-muted">Select the category that best fits your item</p>
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
                        onClick={() => setFormData({ ...formData, category: cat.slug, size: "" })}
                        className={`p-4 rounded-xl border text-left transition-all group ${
                          isSelected
                            ? "border-primary/40 bg-primary/[0.06] shadow-[0_0_15px_rgba(232,136,58,0.08)]"
                            : "border-border bg-surface hover:border-border-hover hover:bg-surface/80"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 transition-colors ${
                          isSelected ? "bg-primary/15 text-primary" : "bg-white/[0.04] text-muted group-hover:text-foreground"
                        }`}>
                          <CatIcon size={16} />
                        </div>
                        <p className={`text-sm font-semibold transition-colors ${isSelected ? "text-primary" : "text-foreground"}`}>
                          {cat.name}
                        </p>
                        <p className="text-[10px] text-muted mt-0.5">{cat.productCount} products</p>
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
                    <p className="text-sm font-semibold text-foreground">Photos</p>
                    <p className="text-[11px] text-muted">Add up to 8 photos. First photo will be your cover.</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <button
                    type="button"
                    className="aspect-square rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/[0.03] flex flex-col items-center justify-center gap-1.5 text-primary hover:bg-primary/[0.06] transition-all"
                  >
                    <Camera size={22} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Add Photo</span>
                  </button>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
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
                  Continue
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
                    <p className="text-sm font-semibold text-foreground">Condition</p>
                    <p className="text-[11px] text-muted">Describe the current state of your item</p>
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
                        onClick={() => setFormData({ ...formData, condition: c.value })}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-primary/40 bg-primary/[0.06] shadow-[0_0_15px_rgba(232,136,58,0.08)]"
                            : "border-border bg-surface hover:border-border-hover"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? "bg-primary/15 text-primary" : `${c.bgColor} ${c.color}`
                        }`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                            {c.label}
                          </p>
                          <p className="text-[11px] text-muted mt-0.5">{c.description}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 size={18} className="text-primary shrink-0" />
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
                      {formData.category === "sneakers" ? <Footprints size={15} /> : <Shirt size={15} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Size</p>
                      <p className="text-[11px] text-muted">Select the size of your item</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {sizeOptions.map((size) => {
                      const isSelected = formData.size === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setFormData({ ...formData, size })}
                          className={`px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                            isSelected
                              ? "border-primary/40 bg-primary/[0.08] text-primary shadow-[0_0_10px_rgba(232,136,58,0.08)]"
                              : "border-border bg-surface text-foreground hover:border-border-hover"
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
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all"
                >
                  Continue
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
                    <p className="text-sm font-semibold text-foreground">Set Your Ask Price</p>
                    <p className="text-[11px] text-muted">The price you want to sell at</p>
                  </div>
                </div>

                <div className="relative mb-5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/40 font-bold text-xl">$</span>
                  <input
                    type="number"
                    value={formData.askPrice}
                    onChange={(e) => setFormData({ ...formData, askPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-5 bg-surface border border-border rounded-xl text-foreground text-3xl font-bold placeholder:text-muted/20 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Market Data */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Lowest Ask", value: "$—", color: "text-emerald-400" },
                    { label: "Highest Bid", value: "$—", color: "text-blue-400" },
                    { label: "Last Sale", value: "$—", color: "text-foreground" },
                  ].map((item) => (
                    <div key={item.label} className="bg-surface rounded-xl border border-border p-3 text-center">
                      <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">{item.label}</p>
                      <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payout Summary */}
              <AnimatePresence>
                {askNum > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
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
                          <p className="text-sm font-semibold text-foreground">Payout Summary</p>
                          <p className="text-[11px] text-muted">What you&apos;ll earn after fees</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted">Sale Price</span>
                          <span className="text-sm font-semibold text-foreground">${askNum.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted">Seller Fee (9%)</span>
                          <span className="text-sm font-semibold text-red-400">-${sellerFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted">Payment Processing (3%)</span>
                          <span className="text-sm font-semibold text-red-400">-${processingFee.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-white/[0.06] pt-3 mt-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-foreground">Total Payout</span>
                            <span className="text-lg font-bold text-emerald-400">${totalPayout.toFixed(2)}</span>
                          </div>
                          {/* Payout bar */}
                          <div className="w-full h-2 rounded-full bg-white/[0.04] mt-3 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: "88%" }}
                              transition={{ duration: 0.6, delay: 0.2 }}
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                            />
                          </div>
                          <p className="text-[10px] text-muted mt-1.5">You keep 88% of the sale price</p>
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
                    <p className="text-sm font-semibold text-foreground">Listing Duration</p>
                    <p className="text-[11px] text-muted">How long your listing stays active</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "30", label: "30 Days" },
                    { value: "60", label: "60 Days" },
                    { value: "90", label: "90 Days" },
                  ].map((dur) => (
                    <button
                      key={dur.value}
                      type="button"
                      onClick={() => setDuration(dur.value)}
                      className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                        duration === dur.value
                          ? "border-primary/40 bg-primary/[0.06] text-primary shadow-[0_0_10px_rgba(232,136,58,0.08)]"
                          : "border-border bg-surface text-foreground hover:border-border-hover"
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
                  <p className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold mb-3">Listing Preview</p>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-surface border border-border flex items-center justify-center text-muted/30 shrink-0">
                      <Package size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {formData.productName || "Product Name"}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {formData.category && (
                          <span className="text-[10px] bg-surface px-2 py-0.5 rounded-lg text-muted capitalize border border-border">
                            {formData.category.replace("-", " ")}
                          </span>
                        )}
                        {formData.size && (
                          <span className="text-[10px] bg-surface px-2 py-0.5 rounded-lg text-muted border border-border">
                            {formData.size}
                          </span>
                        )}
                        <span className="text-[10px] bg-surface px-2 py-0.5 rounded-lg text-muted capitalize border border-border">
                          {conditions.find((c) => c.value === formData.condition)?.label}
                        </span>
                        <span className="text-[10px] bg-surface px-2 py-0.5 rounded-lg text-muted border border-border">
                          {duration} days
                        </span>
                      </div>
                      {askNum > 0 && (
                        <p className="text-xl font-bold text-primary mt-2.5">${askNum.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-3 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!formData.askPrice}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <Tag size={14} />
                  List Item
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
