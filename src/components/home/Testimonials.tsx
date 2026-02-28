"use client";

import { Star, Quote } from "lucide-react";
import { testimonials } from "@/data/site";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/MotionWrapper";

export default function Testimonials() {
  return (
    <section className="py-16 lg:py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">
              What people say
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground tracking-tight">
              Trusted by Thousands
            </h2>
          </div>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((testimonial, i) => (
            <StaggerItem key={i}>
              <div className="relative p-6 bg-card rounded-xl border border-border hover:border-border-hover transition-all duration-300 group">
                <Quote
                  size={32}
                  className="absolute top-4 right-4 text-primary/10 group-hover:text-primary/20 transition-colors"
                />

                <div className="flex mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star
                      key={j}
                      size={14}
                      className="fill-primary text-primary"
                    />
                  ))}
                </div>

                <p className="text-sm text-foreground/80 leading-relaxed mb-6">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-black">
                    {testimonial.avatar}
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {testimonial.name}
                  </span>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
