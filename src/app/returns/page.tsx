import Link from 'next/link';
import {
  Scale,
  ShieldCheck,
  FileWarning,
  Clock,
  RefreshCw,
  MessageCircle,
} from 'lucide-react';
import { FadeIn } from '@/components/motion/MotionWrapper';

export const metadata = {
  title: 'Returns & Dispute Resolution | VendFinder',
  description:
    'How Buyer Protection and dispute resolution work on VendFinder. Payments stay in escrow until you confirm delivery.',
};

export default function ReturnsPage() {
  const steps = [
    {
      num: '01',
      title: 'You place an order',
      description:
        'Your payment is charged by Stripe and held in escrow by VendFinder &mdash; it is not released to the vendor yet.',
    },
    {
      num: '02',
      title: 'Vendor ships your item',
      description:
        'The vendor packs and ships your order, then uploads tracking so you can follow the delivery.',
    },
    {
      num: '03',
      title: 'You confirm delivery',
      description:
        'Once the item arrives and matches the description, you confirm delivery and the funds are released to the vendor.',
    },
    {
      num: '04',
      title: 'Problem? File a dispute',
      description:
        "If the item never arrives or doesn't match the listing, open a dispute before confirming and we'll review the case.",
    },
  ];

  return (
    <div className="bg-dark">
      {/* Hero */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <Scale size={14} />
              Returns &amp; Disputes
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
              Returns &amp; Dispute Resolution
            </h1>
            <p className="text-lg text-muted leading-relaxed max-w-2xl">
              VendFinder doesn&apos;t offer a blanket return policy. Instead,
              every order is covered by Buyer Protection and resolved through
              our dispute system.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* How Buyer Protection Works */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="font-display font-black text-3xl text-foreground mb-3">
                  How Buyer Protection Works
                </h2>
                <p className="text-muted leading-relaxed">
                  Every order is protected by escrow. Your payment is held
                  safely by VendFinder and is only released to the vendor after
                  you confirm delivery. If something goes wrong, we refund you
                  from the escrowed funds &mdash; the vendor never gets paid for
                  a bad order.
                </p>
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
            {steps.map((step, i) => (
              <FadeIn key={step.num} delay={i * 0.08}>
                <div className="bg-card border border-border rounded-2xl p-6 h-full">
                  <div className="text-primary font-display font-black text-2xl mb-2">
                    {step.num}
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Filing a Dispute */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex items-start gap-4 mb-8">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <FileWarning size={22} />
              </div>
              <div>
                <h2 className="font-display font-black text-3xl text-foreground mb-3">
                  Filing a Dispute
                </h2>
                <p className="text-muted leading-relaxed">
                  You can open a dispute from your order page if the item never
                  arrived or doesn&apos;t match the listing description. Attach
                  photos, messages, or any other evidence, and describe what
                  went wrong.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-6">
                <Clock size={20} className="text-primary mb-3" />
                <h3 className="text-base font-bold text-foreground mb-2">
                  Resolution Timeline
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  Most disputes are decided within 5-7 business days. We review
                  both sides and any evidence before making a decision.
                </p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6">
                <RefreshCw size={20} className="text-primary mb-3" />
                <h3 className="text-base font-bold text-foreground mb-2">
                  Refund Process
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  If the dispute is decided in your favor, the escrowed payment
                  is refunded to your original payment method. Most refunds
                  settle in 3-5 business days.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center">
              <MessageCircle size={32} className="text-primary mx-auto mb-4" />
              <h2 className="font-display font-black text-2xl sm:text-3xl text-foreground mb-3">
                Need help with a dispute?
              </h2>
              <p className="text-muted mb-8 max-w-xl mx-auto">
                VendBot is available 24/7 in the chat widget to walk you through
                the dispute process. Or email our support team directly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                >
                  Contact VendBot support
                </Link>
                <Link
                  href="/help"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-surface transition-colors"
                >
                  Visit Help Center
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
