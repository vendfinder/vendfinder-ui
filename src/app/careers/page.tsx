import { Briefcase, Mail, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/motion/MotionWrapper";

export const metadata = {
  title: "Careers | VendFinder",
  description:
    "Join VendFinder as we build the future of global commerce. We're growing our founding team.",
};

export default function CareersPage() {
  return (
    <div className="bg-dark">
      {/* Hero */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <Briefcase size={14} />
              Careers
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
              Build the future of global commerce
            </h1>
            <p className="text-lg text-muted leading-relaxed max-w-2xl">
              VendFinder is a small team with a big ambition: make cross-border
              commerce effortless for every vendor and every buyer, in every
              language.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Pitch */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-foreground mb-6">
              Why VendFinder
            </h2>
            <div className="space-y-4 text-muted leading-relaxed text-base">
              <p>
                We launched in 2026 with a simple idea: verified vendors,
                protected payments, and automatic translation can open global
                commerce to anyone. Every feature we ship &mdash; escrow, Buyer
                Protection, VendBot AI support &mdash; exists to make that
                real.
              </p>
              <p>
                We&apos;re currently growing our founding team. If you care
                about building trustworthy marketplaces, solving hard
                localization problems, or designing experiences that work
                across cultures, we want to talk.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* No open positions */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="bg-card border border-border rounded-2xl p-8 sm:p-12">
              <Sparkles size={28} className="text-primary mb-4" />
              <h2 className="font-display font-black text-2xl sm:text-3xl text-foreground mb-3">
                No open positions right now
              </h2>
              <p className="text-muted leading-relaxed mb-6 max-w-2xl">
                We don&apos;t have active openings at the moment, but
                we&apos;d love to hear from you. If you think you&apos;d be a
                great fit for the founding team, send us a note and tell us
                how you&apos;d move the needle.
              </p>
              <a
                href="mailto:careers@vendfinder.com"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
              >
                <Mail size={16} />
                careers@vendfinder.com
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
