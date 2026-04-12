import { FileText } from 'lucide-react';
import { FadeIn } from '@/components/motion/MotionWrapper';

export const metadata = {
  title: 'Terms of Service — VendFinder',
  description: 'Terms of Service for VendFinder marketplace',
};

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using VendFinder ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform. These terms apply to all users, including buyers, sellers, and visitors.',
  },
  {
    title: '2. Account Registration',
    body: 'You must be at least 18 years old to create an account. You agree to provide accurate, current, and complete information during registration and to keep your account information updated. You are responsible for safeguarding your password and for all activity under your account.',
  },
  {
    title: '3. Seller Subscription',
    body: 'Sellers are required to pay a recurring $100 access fee every 30 days to list products on VendFinder. Access is revoked if the fee is not paid within the billing cycle. Sellers are responsible for the accuracy of their product listings and for fulfilling orders promptly.',
  },
  {
    title: '4. Platform Fees',
    body: 'VendFinder charges a 9% seller fee on each completed sale, plus a 3% payment processing fee. Optional paid features include Featured Listing placement ($25-$125) and Global Listing translation ($2.99 per listing). All fees are deducted from seller payouts.',
  },
  {
    title: '5. Escrow & Payments',
    body: 'All payments are processed via Stripe and held in escrow until the buyer confirms delivery or the delivery confirmation period expires. Sellers receive payout after escrow release. VendFinder is not a party to transactions but acts as a payment intermediary.',
  },
  {
    title: '6. Product Listings',
    body: 'Sellers are solely responsible for the accuracy of product descriptions, pricing, images, and stock levels. Prohibited items include counterfeit goods, illegal substances, weapons, and items violating intellectual property rights. VendFinder reserves the right to remove any listing at its discretion.',
  },
  {
    title: '7. Buyer Protection & Disputes',
    body: 'Buyers may open a dispute within 14 days of delivery if an item is not as described, damaged, or never arrives. Disputes are reviewed by VendFinder within 5-7 business days. Sellers must respond within 48 hours. VendFinder may issue refunds from escrow if the dispute is upheld.',
  },
  {
    title: '8. Shipping & Customs',
    body: 'Shipping is handled entirely by individual sellers. Buyers are responsible for any import duties, taxes, or customs fees imposed by their country. VendFinder does not provide or guarantee shipping services and is not liable for shipping delays, lost packages, or customs issues.',
  },
  {
    title: '9. Intellectual Property',
    body: 'The VendFinder name, logo, and platform are the intellectual property of VendFinder. You may not copy, reproduce, or use our branding without written permission. Product listings remain the property of the respective sellers.',
  },
  {
    title: '10. Prohibited Conduct',
    body: 'You may not engage in fraudulent activity, price manipulation, fake reviews, shill bidding, harassment of other users, or any deceptive practices. VendFinder may suspend or terminate accounts that violate these terms without notice.',
  },
  {
    title: '11. Limitation of Liability',
    body: 'VendFinder provides the marketplace platform "as is" without warranties of any kind. We are not liable for losses arising from transactions, seller actions, shipping failures, customs seizures, or buyer disputes beyond the escrow refund process. Our total liability is limited to the fees paid by you in the preceding 12 months.',
  },
  {
    title: '12. Privacy',
    body: 'Your use of the Platform is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal information.',
  },
  {
    title: '13. Changes to Terms',
    body: 'VendFinder may update these terms at any time. Material changes will be communicated via email or platform notification. Continued use after notification constitutes acceptance of the updated terms.',
  },
  {
    title: '14. Governing Law',
    body: 'These terms are governed by the laws of the United States. Any disputes shall be resolved through binding arbitration except where prohibited by law.',
  },
  {
    title: '15. Contact',
    body: 'For questions about these terms, contact us at support@vendfinder.com.',
  },
];

export default function TermsPage() {
  return (
    <div className="bg-dark min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <FadeIn>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileText size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Legal
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-foreground tracking-tight mb-3">
            Terms of Service
          </h1>
          <p className="text-muted text-sm">Last updated: April 2026</p>
        </FadeIn>

        <div className="mt-12 space-y-8">
          {sections.map((section, i) => (
            <FadeIn key={section.title} delay={0.03 * i}>
              <div>
                <h2 className="text-lg font-bold text-foreground mb-2">
                  {section.title}
                </h2>
                <p className="text-sm text-muted leading-relaxed">
                  {section.body}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </div>
  );
}
