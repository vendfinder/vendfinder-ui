import { Newspaper, Mail, Calendar, Globe, MapPin } from 'lucide-react';
import { FadeIn } from '@/components/motion/MotionWrapper';

export const metadata = {
  title: 'Press & Media | VendFinder',
  description:
    'Press inquiries, media kits, and interview requests for VendFinder, a global marketplace launched in 2026.',
};

export default function PressPage() {
  const facts = [
    { icon: <Calendar size={18} />, label: 'Founded', value: '2026' },
    {
      icon: <Globe size={18} />,
      label: 'Category',
      value: 'Global Marketplace',
    },
    { icon: <MapPin size={18} />, label: 'Based in', value: 'USA' },
  ];

  return (
    <div className="bg-dark">
      {/* Hero */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <Newspaper size={14} />
              Press
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
              Press &amp; Media
            </h1>
            <p className="text-lg text-muted leading-relaxed max-w-2xl">
              VendFinder is a global marketplace connecting verified vendors
              with buyers worldwide. We handle automatic translation into 9
              languages and protect every transaction with escrow and Buyer
              Protection.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Quick Facts */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-foreground mb-8">
              Quick Facts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {facts.map((f) => (
                <div
                  key={f.label}
                  className="bg-card border border-border rounded-2xl p-5"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                    {f.icon}
                  </div>
                  <div className="text-xs text-muted uppercase tracking-wide mb-1">
                    {f.label}
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {f.value}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="bg-card border border-border rounded-2xl p-8 sm:p-12">
              <Mail size={28} className="text-primary mb-4" />
              <h2 className="font-display font-black text-2xl sm:text-3xl text-foreground mb-3">
                Get in touch with our press team
              </h2>
              <p className="text-muted leading-relaxed mb-6 max-w-2xl">
                For press inquiries, media kits, or interviews, reach out to us.
                We aim to respond to journalists within one business day.
              </p>
              <a
                href="mailto:press@vendfinder.com"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
              >
                <Mail size={16} />
                press@vendfinder.com
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
