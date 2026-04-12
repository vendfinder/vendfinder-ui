import { BookOpen, Bell } from 'lucide-react';
import { FadeIn } from '@/components/motion/MotionWrapper';

export const metadata = {
  title: 'Blog | VendFinder',
  description:
    'The VendFinder blog — stories, guides, and updates from the global marketplace. Coming soon.',
};

export default function BlogPage() {
  return (
    <div className="bg-dark">
      {/* Hero */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <BookOpen size={14} />
              Blog
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
              VendFinder Blog
            </h1>
            <p className="text-lg text-muted leading-relaxed max-w-2xl">
              Stories from vendors, buyer guides, and behind-the-scenes notes
              from the team building VendFinder.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="bg-card border border-border rounded-2xl p-8 sm:p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
                <BookOpen size={28} />
              </div>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-foreground mb-4">
                Coming Soon
              </h2>
              <p className="text-muted leading-relaxed mb-10 max-w-xl mx-auto">
                We&apos;re putting the finishing touches on our first posts.
                Expect deep dives on cross-border commerce, vendor spotlights,
                and practical guides for buyers.
              </p>

              <div className="max-w-md mx-auto">
                <label className="text-sm font-medium text-foreground mb-3 block text-left">
                  Get notified when we launch
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-surface border border-border">
                    <Bell size={16} className="text-muted flex-shrink-0" />
                    <span className="text-sm text-muted">your@email.com</span>
                  </div>
                  <button
                    type="button"
                    className="px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Notify me
                  </button>
                </div>
                <p className="text-xs text-muted mt-3 text-left">
                  We&apos;ll only email you when the blog goes live.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
