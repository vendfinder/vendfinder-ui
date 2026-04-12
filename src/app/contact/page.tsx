import {
  Mail,
  MessageCircle,
  Bot,
  Briefcase,
  Newspaper,
  Clock,
} from 'lucide-react';
import { FadeIn } from '@/components/motion/MotionWrapper';

export const metadata = {
  title: 'Contact Us | VendFinder',
  description:
    'Get in touch with VendFinder support, business, or press teams. VendBot AI support is available 24/7.',
};

type ContactCard = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  href?: string;
  responseTime: string;
  highlight?: boolean;
};

const contacts: ContactCard[] = [
  {
    icon: <Bot size={22} />,
    title: 'VendBot AI Support',
    description:
      'Our AI assistant answers most questions instantly, from order status to how disputes work. Available in the chat widget at the bottom-right of every page.',
    action: 'Open chat widget',
    responseTime: 'Instant, 24/7',
    highlight: true,
  },
  {
    icon: <MessageCircle size={22} />,
    title: 'General Support',
    description:
      "For help with your account, orders, disputes, or anything else VendBot can't handle, email our support team.",
    action: 'support@vendfinder.com',
    href: 'mailto:support@vendfinder.com',
    responseTime: 'Within 1 business day',
  },
  {
    icon: <Briefcase size={22} />,
    title: 'Business Inquiries',
    description:
      "Partnerships, integrations, or enterprise questions? We'd love to hear from you.",
    action: 'hello@vendfinder.com',
    href: 'mailto:hello@vendfinder.com',
    responseTime: 'Within 2 business days',
  },
  {
    icon: <Newspaper size={22} />,
    title: 'Press & Media',
    description:
      'For press inquiries, media kits, or interview requests, reach out to our press team.',
    action: 'press@vendfinder.com',
    href: 'mailto:press@vendfinder.com',
    responseTime: 'Within 1 business day',
  },
];

export default function ContactPage() {
  return (
    <div className="bg-dark">
      {/* Hero */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <Mail size={14} />
              Contact
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
              Get in Touch
            </h1>
            <p className="text-lg text-muted leading-relaxed max-w-2xl">
              Choose the fastest channel for your question. Most answers are
              just a chat away with VendBot, available 24/7.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contacts.map((c, i) => (
              <FadeIn key={c.title} delay={i * 0.08}>
                <div
                  className={`bg-card border rounded-2xl p-6 h-full flex flex-col ${
                    c.highlight ? 'border-primary/40' : 'border-border'
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    {c.icon}
                  </div>
                  <h2 className="text-lg font-bold text-foreground mb-2">
                    {c.title}
                  </h2>
                  <p className="text-sm text-muted leading-relaxed mb-4 flex-1">
                    {c.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted mb-4">
                    <Clock size={12} />
                    <span>{c.responseTime}</span>
                  </div>
                  {c.href ? (
                    <a
                      href={c.href}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      {c.action}
                    </a>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm font-semibold">
                      {c.action}
                    </span>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Response Times */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="bg-card border border-border rounded-2xl p-8 sm:p-12">
              <Clock size={28} className="text-primary mb-4" />
              <h2 className="font-display font-black text-2xl sm:text-3xl text-foreground mb-3">
                Response Time Expectations
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                VendBot handles most routine questions instantly. For emails,
                support typically replies within one business day, and business
                or partnership inquiries may take up to two business days.
              </p>
              <p className="text-muted leading-relaxed">
                If you have an urgent order or dispute issue, VendBot can often
                resolve it immediately or escalate it to a human on our support
                team.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
