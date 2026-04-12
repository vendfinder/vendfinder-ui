import { Shield } from 'lucide-react';
import { FadeIn } from '@/components/motion/MotionWrapper';

export const metadata = {
  title: 'Privacy Policy — VendFinder',
  description: 'Privacy Policy for VendFinder marketplace',
};

const sections = [
  {
    title: '1. Information We Collect',
    body: 'We collect information you provide directly: name, email, username, password, payment information, shipping address, and profile details. We also automatically collect usage data such as IP address, browser type, device identifiers, pages visited, and language preferences (used for auto-translation). Payment details are handled by Stripe — we do not store full card numbers on our servers.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'We use your information to: provide and maintain the Platform, process transactions, facilitate communication between buyers and sellers, translate content to your preferred language, send order notifications, prevent fraud, respond to support requests, and improve our services.',
  },
  {
    title: '3. Information Sharing',
    body: 'We share information with sellers (when you buy their product), buyers (when you sell to them), payment processors (Stripe), shipping providers (when sellers arrange delivery), translation services (Google Cloud Translate for auto-translating listings and messages), and law enforcement when legally required. We do not sell your personal information to third parties.',
  },
  {
    title: '4. Cookies & Tracking',
    body: 'We use cookies to maintain your session, remember your language preference, detect your country for automatic localization, and provide security. You can disable cookies in your browser, but some features may not function properly.',
  },
  {
    title: '5. Geolocation & Language Detection',
    body: 'We detect your country via IP address to automatically show the Platform in your preferred language. This detection happens server-side and the result is stored in a cookie on your device. You can change the displayed language at any time using the language switcher.',
  },
  {
    title: '6. Message Translation',
    body: 'Chat messages between buyers and sellers may be translated via Google Cloud Translate to enable cross-language communication. Translations are cached on our servers for 24 hours to reduce costs. Original message text is always preserved.',
  },
  {
    title: '7. Data Security',
    body: 'We use industry-standard security measures including TLS/HTTPS encryption, password hashing, and escrow-protected payment processing. No system is 100% secure; we cannot guarantee absolute security but work continuously to protect your data.',
  },
  {
    title: '8. Data Retention',
    body: 'We retain your account information as long as your account is active. Order records are kept for 7 years for tax and legal compliance. You may request deletion of your account at any time, subject to our legal obligations to retain transaction records.',
  },
  {
    title: '9. Your Rights',
    body: 'Depending on your jurisdiction, you may have rights to: access your personal data, correct inaccurate data, delete your data, restrict processing, data portability, and opt out of marketing communications. To exercise these rights, contact us at privacy@vendfinder.com.',
  },
  {
    title: '10. International Data Transfers',
    body: 'VendFinder is a global marketplace. Your data may be transferred to and processed in countries other than your country of residence, including the United States. By using the Platform, you consent to these transfers.',
  },
  {
    title: "11. Children's Privacy",
    body: 'The Platform is not intended for users under 18. We do not knowingly collect personal information from children. If we discover that we have collected data from a child, we will delete it promptly.',
  },
  {
    title: '12. Third-Party Services',
    body: 'The Platform integrates with Stripe (payments), Google Cloud Translate (translations), and shipping providers (chosen by sellers). These services have their own privacy policies governing how they handle your data.',
  },
  {
    title: '13. Marketing Communications',
    body: 'With your consent, we may send you marketing emails about new features, promotions, and platform updates. You can unsubscribe at any time using the link in any marketing email.',
  },
  {
    title: '14. Changes to This Policy',
    body: 'We may update this Privacy Policy periodically. Material changes will be announced via email or prominent platform notification. The "Last updated" date reflects the most recent revision.',
  },
  {
    title: '15. Contact Us',
    body: 'For privacy questions or to exercise your rights, contact us at privacy@vendfinder.com.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-dark min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <FadeIn>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Shield size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Legal
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-foreground tracking-tight mb-3">
            Privacy Policy
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
