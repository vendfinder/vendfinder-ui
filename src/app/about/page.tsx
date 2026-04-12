import Link from 'next/link';
import {
  BadgeCheck,
  Lock,
  Languages,
  Globe,
  Users,
  ArrowRight,
} from 'lucide-react';
import { FadeIn } from '@/components/motion/MotionWrapper';

export const metadata = {
  title: 'About Us | VendFinder',
  description:
    'VendFinder connects global vendors with buyers worldwide through verified listings, escrow protection, and automatic translation in 9 languages.',
};

export default function AboutPage() {
  const features = [
    {
      icon: <BadgeCheck size={22} />,
      title: 'Verified Sellers',
      description:
        "Every vendor is authenticated and pays a monthly subscription to list, so you know you're buying from a committed business.",
    },
    {
      icon: <Lock size={22} />,
      title: 'Escrow Protected',
      description:
        'Payments are held securely until you confirm delivery. If something goes wrong, our dispute system has your back.',
    },
    {
      icon: <Languages size={22} />,
      title: '9 Languages',
      description:
        'Listings are automatically translated into 9 languages so buyers and vendors can do business without friction.',
    },
  ];

  const stats = [
    { value: 'Global', label: 'Vendor Network' },
    { value: 'Worldwide', label: 'Buyers Served' },
    { value: '9', label: 'Languages Supported' },
  ];

  return (
    <div className="bg-dark">
      {/* Hero */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <Globe size={14} />
              About VendFinder
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
              Connecting Vendors &amp; Buyers Worldwide
            </h1>
            <p className="text-lg text-muted leading-relaxed max-w-2xl">
              VendFinder is a global marketplace built to remove the barriers
              between vendors and buyers &mdash; across borders, languages, and
              currencies. Our mission is simple: make cross-border commerce
              safer, clearer, and more accessible for everyone.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-foreground mb-6">
              Our Mission
            </h2>
            <div className="space-y-4 text-muted leading-relaxed text-base">
              <p>
                We connect verified vendors &mdash; primarily from mainland
                China &mdash; with buyers around the world. Our platform handles
                automatic translation into 9 languages, authenticates sellers,
                and protects every transaction with escrow.
              </p>
              <p>
                When you buy on VendFinder, your payment is held in escrow until
                you confirm delivery. If an item never arrives or doesn&apos;t
                match its description, our dispute resolution system gets you a
                full refund through Buyer Protection.
              </p>
              <p>
                Vendors pay a flat $100 monthly subscription to list products.
                That keeps the marketplace serious, and it keeps us aligned with
                the success of every seller on the platform.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-foreground mb-12 text-center">
              Built for Trust
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.1}>
                <div className="bg-card border border-border rounded-2xl p-6 h-full">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 lg:py-24 border-b border-border bg-surface/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="font-display font-black text-4xl sm:text-5xl text-primary mb-2">
                    {s.value}
                  </div>
                  <div className="text-sm text-muted uppercase tracking-wide">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center">
              <Users size={32} className="text-primary mx-auto mb-4" />
              <h2 className="font-display font-black text-2xl sm:text-3xl text-foreground mb-3">
                Ready to join VendFinder?
              </h2>
              <p className="text-muted mb-8 max-w-xl mx-auto">
                Whether you&apos;re here to sell globally or to discover
                products from verified vendors, we&apos;d love to have you.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                >
                  Start selling
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-surface transition-colors"
                >
                  Browse products
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
