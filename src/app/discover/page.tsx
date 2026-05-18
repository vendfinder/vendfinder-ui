'use client';

import { motion } from 'framer-motion';
import { Users, TrendingUp, Sparkles, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import UserSearch from '@/components/social/UserSearch';

export default function DiscoverPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/discover');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f05] via-[#0f0b15] to-[#0a0d18]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(232,136,58,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(139,92,246,0.08),transparent_55%)]" />

        {/* Animated particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.2,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/20 mb-6"
            >
              <Users size={32} className="text-primary" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-4xl sm:text-5xl font-bold text-white mb-4"
            >
              Discover Amazing
              <span className="block bg-gradient-to-r from-primary via-amber-400 to-orange-500 bg-clip-text text-transparent">
                Sellers & Collectors
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-muted max-w-2xl mx-auto mb-8 leading-relaxed"
            >
              Connect with fellow sneaker enthusiasts, vintage collectors,
              and fashion mavens. Find your tribe in the vendfinder community.
            </motion.p>


          </motion.div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="-mt-8 relative z-10"
        >
          <UserSearch autoFocus />
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
        >
          {[
            {
              title: 'Smart Discovery',
              description: 'Find sellers and collectors based on your interests, location, and mutual connections.',
              icon: Search,
              color: 'primary',
            },
            {
              title: 'Curated Suggestions',
              description: 'Get personalized recommendations for users you might want to follow and connect with.',
              icon: TrendingUp,
              color: 'violet-500',
            },
            {
              title: 'Community Building',
              description: 'Build your network of trusted sellers, collectors, and fellow enthusiasts.',
              icon: Users,
              color: 'emerald-500',
            },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="group"
              >
                <div className="bg-card rounded-2xl border border-border p-6 h-full hover:border-border-hover transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg group-hover:shadow-black/10">
                  <div className={`w-12 h-12 rounded-xl bg-${feature.color}/10 text-${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-muted leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-card to-surface/50 rounded-2xl border border-border p-8">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Start Building Your Network
            </h2>
            <p className="text-muted mb-6 max-w-lg mx-auto">
              Connect with like-minded collectors and discover your next favorite seller.
              Your community is waiting.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.querySelector('input')?.focus()}
                className="px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all"
              >
                Start Searching
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/following')}
                className="px-8 py-3 border border-border text-foreground font-semibold rounded-xl hover:border-primary hover:text-primary transition-all"
              >
                View Following
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/dashboard/profile')}
                className="px-6 py-3 border border-border text-foreground font-semibold rounded-xl hover:border-primary hover:text-primary transition-all"
              >
                Update Profile
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}