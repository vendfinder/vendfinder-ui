"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CreditCard,
  Lock,
  MapPin,
  Package,
  Shield,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Home,
  ArrowRight,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearCart();
    router.push("/checkout/success");
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
          <Package size={32} className="text-muted/30" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Nothing to checkout</h1>
        <p className="text-sm text-muted mb-6">Add some items to your cart first</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-all"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const shipping = totalPrice >= 50 ? 0 : 5.99;
  const tax = totalPrice * 0.08;
  const grandTotal = totalPrice + shipping + tax;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-400/10 flex items-center justify-center">
            <CheckCircle2 size={15} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Checkout</h1>
        </div>
        <p className="text-sm text-muted">Complete your order securely</p>
      </motion.div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="flex items-center gap-3 mb-8"
      >
        {["Cart", "Checkout", "Confirmation"].map((step, i) => (
          <div key={step} className="flex items-center gap-3 flex-1">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              i <= 1
                ? i === 1
                  ? "bg-primary text-white"
                  : "bg-emerald-400/10 text-emerald-400"
                : "bg-surface text-muted border border-border"
            }`}>
              {i < 1 ? <CheckCircle2 size={12} /> : <span>{i + 1}</span>}
              <span className="hidden sm:inline">{step}</span>
            </div>
            {i < 2 && <div className={`flex-1 h-px ${i < 1 ? "bg-emerald-400/40" : "bg-border"}`} />}
          </div>
        ))}
      </motion.div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Form */}
          <div className="flex-1 space-y-6">
            {/* Shipping */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-card rounded-2xl border border-border p-6"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-blue-400/10 text-blue-400 flex items-center justify-center">
                  <MapPin size={15} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Shipping Address</p>
                  <p className="text-[11px] text-muted">Where should we deliver?</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: "first-name", label: "First Name", placeholder: "John", icon: User, span: false },
                  { id: "last-name", label: "Last Name", placeholder: "Doe", icon: User, span: false },
                  { id: "address", label: "Address", placeholder: "123 Main St", icon: Home, span: true },
                  { id: "city", label: "City", placeholder: "New York", icon: MapPin, span: false },
                  { id: "state", label: "State", placeholder: "NY", icon: MapPin, span: false },
                  { id: "zip", label: "ZIP Code", placeholder: "10001", icon: Mail, span: false },
                  { id: "phone", label: "Phone", placeholder: "(555) 123-4567", icon: Phone, span: false },
                ].map((field) => {
                  const Icon = field.icon;
                  return (
                    <div key={field.id} className={field.span ? "sm:col-span-2" : ""}>
                      <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                        {field.label}
                      </label>
                      <div className="relative">
                        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
                        <input
                          placeholder={field.placeholder}
                          className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Payment */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="bg-card rounded-2xl border border-border p-6"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-violet-400/10 text-violet-400 flex items-center justify-center">
                  <CreditCard size={15} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Payment</p>
                  <p className="text-[11px] text-muted">Enter your card details</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                    Card Number
                  </label>
                  <div className="relative">
                    <CreditCard size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
                    <input
                      placeholder="1234 5678 9012 3456"
                      className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                      Expiry
                    </label>
                    <input
                      placeholder="MM/YY"
                      className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                      CVC
                    </label>
                    <input
                      placeholder="123"
                      className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                    Name on Card
                  </label>
                  <input
                    placeholder="John Doe"
                    className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-4 text-[11px] text-muted">
                <Lock size={11} className="text-emerald-400" />
                Your payment info is encrypted and secure
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="w-full lg:w-80"
          >
            <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
                Order Summary
              </h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
                      <Package size={14} className="text-muted/30" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-foreground truncate">{item.product.name}</p>
                      <p className="text-[11px] text-muted">x{item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/[0.06] pt-3 space-y-2.5 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="text-foreground font-medium">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? "text-emerald-400 font-medium" : "text-foreground font-medium"}>
                    {shipping === 0 ? "Free" : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Tax</span>
                  <span className="text-foreground font-medium">{formatPrice(tax)}</span>
                </div>
                <div className="border-t border-white/[0.06] pt-3 flex justify-between font-bold text-foreground text-base">
                  <span>Total</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full mt-6 px-6 py-3.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all"
              >
                <Lock size={14} />
                Place Order
              </button>
              <div className="flex items-center justify-center gap-3 mt-4 text-[10px] text-muted">
                <span className="flex items-center gap-1">
                  <Shield size={10} className="text-emerald-400" />
                  SSL Encrypted
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={10} className="text-blue-400" />
                  Buyer Protection
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
