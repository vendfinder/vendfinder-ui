import Link from "next/link";
import {
  HelpCircle,
  Search,
  ShoppingBag,
  Store,
  CreditCard,
  Scale,
  UserCircle,
  Languages,
  MessageCircle,
} from "lucide-react";
import { FadeIn } from "@/components/motion/MotionWrapper";

export const metadata = {
  title: "Help Center | VendFinder",
  description:
    "Answers to common questions about buying, selling, payments, disputes, and translations on VendFinder.",
};

type FAQ = { q: string; a: string };
type Category = {
  icon: React.ReactNode;
  title: string;
  faqs: FAQ[];
};

const categories: Category[] = [
  {
    icon: <ShoppingBag size={20} />,
    title: "Buying",
    faqs: [
      {
        q: "How do I place an order?",
        a: "Browse products, add items to your cart, and check out with Card or Alipay via Stripe. Your payment is held in escrow until you confirm delivery.",
      },
      {
        q: "Can I trust the vendors?",
        a: "Every vendor is verified and pays a $100 monthly subscription to list products. We also protect every transaction with escrow and Buyer Protection.",
      },
      {
        q: "What happens if my item doesn't arrive?",
        a: "You can open a dispute through your order page. If the item never arrives or doesn't match the description, you'll get a full refund from escrow.",
      },
      {
        q: "Can I message a vendor before buying?",
        a: "Yes. You can contact any vendor from their product or store page to ask questions before you purchase.",
      },
    ],
  },
  {
    icon: <Store size={20} />,
    title: "Selling",
    faqs: [
      {
        q: "How do I become a vendor?",
        a: "Sign up for a vendor account and subscribe to the $100/month plan. Once verified, you can start listing products.",
      },
      {
        q: "Do I have to translate my listings?",
        a: "No. VendFinder automatically translates your listings into 9 languages (en-US, en-GB, es-MX, zh-CN, zh-TW, ja-JP, de-DE, fr-FR, pt-BR).",
      },
      {
        q: "How do I get paid?",
        a: "Funds are released from escrow to your account after the buyer confirms delivery or the confirmation window ends without a dispute.",
      },
      {
        q: "Who handles shipping?",
        a: "Vendors handle their own shipping. You set your own rates, carriers, and handling times, and provide tracking information to buyers.",
      },
    ],
  },
  {
    icon: <CreditCard size={20} />,
    title: "Payments",
    faqs: [
      {
        q: "What payment methods do you accept?",
        a: "We accept credit and debit cards and Alipay, processed securely through Stripe.",
      },
      {
        q: "Is my payment information safe?",
        a: "Yes. Card details are handled directly by Stripe and never stored on VendFinder servers.",
      },
      {
        q: "What currency are prices in?",
        a: "Prices are shown in your local currency based on your region, and Stripe handles currency conversion at checkout.",
      },
      {
        q: "When is my payment released to the vendor?",
        a: "Your payment stays in escrow until you confirm delivery. Only then is it released to the vendor.",
      },
    ],
  },
  {
    icon: <Scale size={20} />,
    title: "Disputes",
    faqs: [
      {
        q: "How do I open a dispute?",
        a: "Go to your order and click 'Open dispute'. Explain the issue and attach photos or evidence. Our team reviews the case and typically decides within 5-7 business days.",
      },
      {
        q: "When should I file a dispute?",
        a: "File a dispute if your item didn't arrive, arrived damaged, or doesn't match the listing description.",
      },
      {
        q: "What happens if I win the dispute?",
        a: "You receive a full refund from the escrowed payment. No action from the vendor is required on your side.",
      },
      {
        q: "Can I cancel a dispute?",
        a: "Yes, you can withdraw a dispute at any time before a decision is made, for example if you and the vendor resolve the issue directly.",
      },
    ],
  },
  {
    icon: <UserCircle size={20} />,
    title: "Account",
    faqs: [
      {
        q: "How do I create an account?",
        a: "Click Sign Up and register with your email. You can choose to sign up as a buyer or a vendor.",
      },
      {
        q: "How do I reset my password?",
        a: "Click 'Forgot password' on the login page and follow the email instructions we send you.",
      },
      {
        q: "Can I change my email address?",
        a: "Yes. Go to Profile Settings to update your email. You'll need to verify the new address.",
      },
      {
        q: "How do I delete my account?",
        a: "Contact support@vendfinder.com and we'll close your account after resolving any open orders or disputes.",
      },
    ],
  },
  {
    icon: <Languages size={20} />,
    title: "Translations",
    faqs: [
      {
        q: "How many languages are supported?",
        a: "Nine: en-US, en-GB, es-MX, zh-CN, zh-TW, ja-JP, de-DE, fr-FR, and pt-BR.",
      },
      {
        q: "Are translations automatic?",
        a: "Yes. Listings are translated automatically so vendors write once and buyers read in their own language.",
      },
      {
        q: "Can I see the original listing?",
        a: "Yes. Every product page lets you switch back to the vendor's original language.",
      },
      {
        q: "What if a translation looks wrong?",
        a: "You can report a bad translation from the product page and we'll review and correct it.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="bg-dark">
      {/* Hero */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <HelpCircle size={14} />
              Help Center
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
              How can we help?
            </h1>
            <p className="text-lg text-muted leading-relaxed max-w-2xl mb-8">
              Search our knowledge base or browse categories below to find
              answers fast.
            </p>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border max-w-2xl">
              <Search size={18} className="text-muted flex-shrink-0" />
              <span className="text-sm text-muted flex-1">
                Search help articles...
              </span>
              <kbd className="hidden sm:inline text-xs px-2 py-1 rounded bg-surface border border-border text-muted">
                Enter
              </kbd>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((cat, i) => (
              <FadeIn key={cat.title} delay={i * 0.05}>
                <div className="bg-card border border-border rounded-2xl p-6 h-full">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      {cat.icon}
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                      {cat.title}
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {cat.faqs.map((faq) => (
                      <div key={faq.q}>
                        <h3 className="text-sm font-semibold text-foreground mb-1">
                          {faq.q}
                        </h3>
                        <p className="text-sm text-muted leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center">
              <MessageCircle size={32} className="text-primary mx-auto mb-4" />
              <h2 className="font-display font-black text-2xl sm:text-3xl text-foreground mb-3">
                Still need help?
              </h2>
              <p className="text-muted mb-8 max-w-xl mx-auto">
                Chat with VendBot 24/7 from the chat widget, or reach out to
                our support team directly.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
              >
                Contact support
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
