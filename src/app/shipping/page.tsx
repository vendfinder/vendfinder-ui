import Link from 'next/link';
import {
  Truck,
  Globe,
  Clock,
  FileText,
  MapPin,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { FadeIn } from '@/components/motion/MotionWrapper';

export const metadata = {
  title: 'Shipping Information | VendFinder',
  description:
    'How shipping works on VendFinder. Vendors ship directly to buyers worldwide. Review timeframes, tracking, customs, and costs.',
};

export default function ShippingPage() {
  const items = [
    {
      icon: <Clock size={22} />,
      title: 'Typical Timeframes',
      description:
        'International shipping usually takes 7-21 days depending on the carrier and destination. Domestic shipments typically arrive in 3-7 days. Your vendor lists their estimated handling and delivery times on each product.',
    },
    {
      icon: <Globe size={22} />,
      title: 'International Customs & Duties',
      description:
        "Cross-border orders may be subject to customs duties, taxes, or import fees set by your country. These charges are the buyer's responsibility and are not included in the product price or shipping cost.",
    },
    {
      icon: <FileText size={22} />,
      title: 'Tracking',
      description:
        'Vendors provide tracking numbers for every shipment. You can view tracking from your order page as soon as the vendor marks the order shipped.',
    },
    {
      icon: <DollarSign size={22} />,
      title: 'Shipping Costs',
      description:
        'Shipping costs vary by vendor, carrier, weight, and destination. The exact shipping cost is shown at checkout before you pay.',
    },
  ];

  return (
    <div className="bg-dark">
      {/* Hero */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <Truck size={14} />
              Shipping
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
              Shipping Information
            </h1>
            <p className="text-lg text-muted leading-relaxed max-w-2xl">
              VendFinder is a marketplace &mdash; not a logistics company.
              Shipping is handled directly by the individual vendor who sold you
              the product.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="bg-card border border-primary/30 rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Shipping is handled by individual vendors
                  </h2>
                  <p className="text-muted leading-relaxed">
                    VendFinder does not warehouse, pack, or ship products. Each
                    vendor sets their own shipping methods, carriers, rates, and
                    handling times. When you place an order, you are contracting
                    with the vendor for delivery. If you have questions about
                    your shipment, contact your vendor first &mdash; or open a
                    dispute if they&apos;re not responsive.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Details */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-foreground mb-10">
              What to expect
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                <div className="bg-card border border-border rounded-2xl p-6 h-full">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center">
              <MapPin size={32} className="text-primary mx-auto mb-4" />
              <h2 className="font-display font-black text-2xl sm:text-3xl text-foreground mb-3">
                Problem with your shipment?
              </h2>
              <p className="text-muted mb-8 max-w-xl mx-auto">
                Start by messaging your vendor. If that doesn&apos;t resolve
                things, open a dispute and our team will step in.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/returns"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                >
                  Learn about disputes
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-surface transition-colors"
                >
                  Contact support
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
