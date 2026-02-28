"use client";

import { Send, Zap } from "lucide-react";
import { FadeIn } from "@/components/motion/MotionWrapper";

export default function Newsletter() {
  return (
    <section className="py-16 lg:py-24 bg-dark relative overflow-hidden">
      {/* Accent glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <Zap size={14} />
              Never miss a drop
            </div>

            <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground tracking-tight">
              Stay in the Loop
            </h2>
            <p className="mt-4 text-muted">
              Get early access to new drops, exclusive deals, and trending
              product alerts — straight to your inbox.
            </p>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark hover:shadow-[0_0_24px_rgba(232,136,58,0.25)] transition-all cursor-pointer"
              >
                Subscribe
                <Send size={16} />
              </button>
            </form>

            <p className="mt-4 text-xs text-muted">
              No spam ever. Unsubscribe anytime.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
