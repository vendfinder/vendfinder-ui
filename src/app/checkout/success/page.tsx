"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Package, ArrowRight, ShoppingBag, Mail, Truck, BarChart3 } from "lucide-react";

export default function CheckoutSuccessPage() {
  const orderId = `ORD-${Date.now().toString().slice(-8)}`;

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      {/* Success icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
        className="w-20 h-20 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle2 size={36} className="text-emerald-400" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Order Confirmed!
        </h1>
        <p className="text-sm text-muted mb-2">
          Thank you for your purchase. Your order has been placed successfully.
        </p>
        <p className="text-sm font-mono bg-surface px-3 py-1.5 rounded-lg border border-border inline-block text-foreground mb-8">
          {orderId}
        </p>
      </motion.div>

      {/* What's next */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-card rounded-2xl border border-border p-6 text-left mb-8"
      >
        <p className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold mb-4">
          What&apos;s Next
        </p>
        <div className="space-y-4">
          {[
            { icon: Mail, color: "text-blue-400", bgColor: "bg-blue-400/10", text: "You'll receive an email confirmation shortly" },
            { icon: Package, color: "text-amber-400", bgColor: "bg-amber-400/10", text: "Your seller will ship within 2 business days" },
            { icon: Truck, color: "text-violet-400", bgColor: "bg-violet-400/10", text: "We'll notify you when your order ships" },
            { icon: BarChart3, color: "text-emerald-400", bgColor: "bg-emerald-400/10", text: "Track your order from your dashboard" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.35 + i * 0.06 }}
                className="flex items-center gap-3"
              >
                <div className={`w-8 h-8 rounded-xl ${item.bgColor} ${item.color} flex items-center justify-center shrink-0`}>
                  <Icon size={14} />
                </div>
                <p className="text-sm text-foreground/80">{item.text}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-3 justify-center"
      >
        <Link
          href="/dashboard/buying"
          className="flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] transition-all"
        >
          View Orders
          <ArrowRight size={14} />
        </Link>
        <Link
          href="/products"
          className="flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all"
        >
          <ShoppingBag size={14} />
          Continue Shopping
        </Link>
      </motion.div>
    </div>
  );
}
