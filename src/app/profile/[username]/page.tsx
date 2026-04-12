'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  MapPin,
  Calendar,
  Star,
  Clock,
  Package,
  Eye,
  Tag,
  Heart,
  Briefcase,
  Instagram,
  Globe,
  Users,
  UserPlus,
  UserCheck,
  Shield,
  TrendingUp,
  TrendingDown,
  Share2,
  Edit3,
  ExternalLink,
  MessageCircle,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { formatPrice } from '@/lib/utils';
import { fetchUserByUsername, ApiUser } from '@/lib/api-users';
import { fetchPublicSellerStats } from '@/lib/api-orders';
import VerificationBadge from '@/components/ui/VerificationBadge';
import type { User, Story } from '@/types';
import { fetchUserStories } from '@/lib/api-stories';
import StoriesBar from '@/components/stories/StoriesBar';
import { useStoryStore } from '@/stores/stories';
import { useTranslations } from 'next-intl';

type ProfileTab = 'selling' | 'feedback' | 'favorites' | 'collection' | 'terms';

const sellerTerms = [
  {
    title: '1. Seller Account & Eligibility',
    body: 'You must be at least 18 years old and provide accurate business information. Seller accounts are subject to approval by VendFinder. You are responsible for maintaining the accuracy of your vendor profile, including business name, contact information, and product listings.',
  },
  {
    title: '2. Platform Fees',
    body: 'VendFinder charges a 10% platform fee on each completed sale. This fee is automatically deducted from your earnings before payout. The fee covers payment processing, platform maintenance, customer support, and dispute resolution services.',
  },
  {
    title: '3. Payouts',
    body: 'Seller earnings are available for payout after an order is marked as delivered and the buyer confirmation period has passed. Payouts are processed on a regular schedule to your designated payment method. VendFinder may hold payouts if there are pending disputes or suspected policy violations.',
  },
  {
    title: '4. Product Listings & Obligations',
    body: 'You are responsible for the accuracy of your product listings, including descriptions, pricing, images, and stock levels. You must fulfill orders promptly and maintain reasonable shipping timelines. You may not list prohibited items including counterfeit goods, illegal substances, or items that violate intellectual property rights.',
  },
  {
    title: '5. Disputes & Returns',
    body: "You must respond to buyer disputes within 48 hours. VendFinder may mediate disputes and issue refunds on your behalf if you fail to respond or if VendFinder determines the buyer's claim is valid. Excessive disputes or poor seller ratings may result in account review or suspension.",
  },
  {
    title: '6. Seller Conduct',
    body: 'You may not engage in price manipulation, fake reviews, shill bidding, or any deceptive practices. You must comply with all applicable laws and regulations for your business. VendFinder reserves the right to suspend or terminate seller accounts that violate these terms.',
  },
  {
    title: '7. Limitation of Liability',
    body: 'VendFinder provides the marketplace platform but is not a party to transactions between buyers and sellers. You are solely responsible for the products you sell, including product safety, legal compliance, and customer satisfaction. VendFinder is not liable for losses arising from your business operations on the platform.',
  },
  {
    title: '8. Changes to Terms',
    body: 'VendFinder may update these terms at any time. You will be notified of material changes and asked to re-accept the updated terms. Continued use of the platform after notification constitutes acceptance of the updated terms.',
  },
];

interface FeedbackItem {
  id: string;
  buyer: string;
  rating: number;
  comment: string;
  title: string;
  date: string;
  item: string;
}

function apiUserToProfileUser(u: ApiUser): Partial<User> {
  return {
    id: u.id,
    name: u.displayName || u.username,
    username: u.username,
    bio: u.bio || undefined,
    location: u.location || undefined,
    verified: u.verified ?? false,
    sellerLevel: u.sellerLevel ?? 0,
    followers: u.followersCount ?? 0,
    following: u.followingCount ?? 0,
    profileViews: u.profileViews ?? 0,
    avatar: u.avatarUrl || undefined,
    joinedDate: u.createdAt ? u.createdAt.split('T')[0] : '',
    socialLinks: {
      instagram: u.socialInstagram || undefined,
      twitter: u.socialTwitter || undefined,
      website: u.socialWebsite || undefined,
    },
  };
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuth();
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<ProfileTab>('selling');
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileUser, setProfileUser] = useState<Partial<User> | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const {
    favorites,
    portfolio,
    sellerStats: ownStats,
    listings,
  } = useDashboardData();
  const isOwnProfile = user?.username === params.username;
  const [publicStats, setPublicStats] = useState<{
    totalSales: number;
    avgShipTime: string;
    completionRate: number;
    sellerRating: number;
    verification?: {
      verified: boolean;
      proSeller: boolean;
      topRated: boolean;
      kycVerified: boolean;
    };
  } | null>(null);

  // For own profile, use full stats from dashboard; for others, use public stats
  const sellerStats = isOwnProfile
    ? ownStats
    : {
        totalSales: publicStats?.totalSales ?? 0,
        totalRevenue: 0,
        avgShipTime: publicStats?.avgShipTime ?? 'N/A',
        completionRate: publicStats?.completionRate ?? 100,
        sellerRating: publicStats?.sellerRating ?? 0,
        totalListings: 0,
        activeListings: 0,
        pendingSales: 0,
        totalPurchases: 0,
        activeBids: 0,
        portfolioValue: 0,
        totalFavorites: 0,
      };
  const activeListings = listings.filter((l) => l.status === 'active');
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [profileStories, setProfileStories] = useState<Story[]>([]);
  const { feed, openViewer, openCreator, fetchFeed } = useStoryStore();

  // Fetch the profile user from the API
  useEffect(() => {
    const username = params.username as string;
    if (!username) return;

    // If viewing own profile, use local user data
    if (isOwnProfile && user) {
      setProfileUser(user);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    fetchUserByUsername(username).then(({ user: fetchedUser, error }) => {
      if (fetchedUser) {
        setProfileUser(apiUserToProfileUser(fetchedUser));
      }
      setProfileLoading(false);
    });
  }, [params.username, isOwnProfile, user]);

  // Fetch public seller stats when viewing someone else's profile
  useEffect(() => {
    if (isOwnProfile || !profileUser?.id) {
      setPublicStats(null);
      return;
    }
    fetchPublicSellerStats(profileUser.id).then(setPublicStats);
  }, [isOwnProfile, profileUser?.id]);

  // Fetch stories for this profile user + populate the story store feed
  useEffect(() => {
    if (!profileUser?.id) return;
    fetchUserStories(profileUser.id, token || undefined).then(
      setProfileStories
    );
    if (token) fetchFeed(token);
  }, [profileUser?.id, token, fetchFeed]);

  // Derived story state for the avatar ring
  const hasStories = profileStories.length > 0;
  const hasUnviewedStories = profileStories.some((s) => !s.viewed);
  // Find this user's group index in the feed store (for the viewer)
  const profileGroupIndex = feed.findIndex((g) => g.userId === profileUser?.id);

  // Fetch reviews/feedback for this seller
  useEffect(() => {
    if (!profileUser?.id) return;
    fetch(`/api/reviews?vendor_id=${profileUser.id}&limit=50`)
      .then((r) => (r.ok ? r.json() : { reviews: [] }))
      .then((data) => {
        const items: FeedbackItem[] = (data.reviews || []).map(
          (r: Record<string, unknown>) => ({
            id: r.id as string,
            buyer:
              (r.author as { username?: string })?.username ||
              (r.author_name as string) ||
              'Anonymous',
            rating: r.rating as number,
            title: (r.title as string) || '',
            comment: (r.content as string) || '',
            date: new Date(r.created_at as string).toLocaleDateString(),
            item: (r.product_id as string) || '',
          })
        );
        setFeedbackItems(items);
      })
      .catch(() => {});
  }, [profileUser?.id]);

  // Use the fetched profile user for display, fallback to logged-in user for own profile
  const displayUser = profileUser || user;

  const tabs: {
    key: ProfileTab;
    label: string;
    count: number;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'selling',
      label: t('profile.selling'),
      count: activeListings.length,
      icon: <Tag size={13} />,
    },
    {
      key: 'feedback',
      label: t('profile.feedback'),
      count: feedbackItems.length,
      icon: <Star size={13} />,
    },
    {
      key: 'favorites',
      label: t('profile.favorites'),
      count: favorites.length,
      icon: <Heart size={13} />,
    },
    {
      key: 'collection',
      label: t('profile.collection'),
      count: portfolio.length,
      icon: <Briefcase size={13} />,
    },
    {
      key: 'terms',
      label: t('profile.sellerTerms'),
      count: sellerTerms.length,
      icon: <FileText size={13} />,
    },
  ];

  const totalCollectionValue = portfolio.reduce(
    (sum, p) => sum + p.currentValue,
    0
  );

  return (
    <div className="min-h-screen">
      {/* ─── BANNER ─── */}
      <div className="relative h-44 sm:h-56 overflow-hidden">
        {displayUser?.banner ? (
          <img
            src={displayUser.banner}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <>
            {/* Gradient base */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f05] via-[#0f0b15] to-[#0a0d18]" />
            {/* Radial orbs */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(232,136,58,0.18),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(139,92,246,0.12),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_80%,rgba(59,130,246,0.08),transparent_50%)]" />
            {/* Diagonal lines */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(135deg, transparent, transparent 24px, white 24px, white 25px)',
              }}
            />
          </>
        )}
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        {/* Noise overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* ─── PROFILE HEADER ─── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 sm:-mt-24 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-6">
            {/* Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative shrink-0"
            >
              {/* Profile avatar with flush story ring (no gap) */}
              <style jsx global>{`
                @property --profile-ring-angle {
                  syntax: '<angle>';
                  initial-value: 0deg;
                  inherits: false;
                }
                @keyframes profile-ring-spin {
                  to {
                    --profile-ring-angle: 360deg;
                  }
                }
              `}</style>
              <button
                type="button"
                onClick={() => {
                  if (hasStories && profileGroupIndex >= 0) {
                    openViewer(profileGroupIndex);
                  } else if (isOwnProfile) {
                    openCreator();
                  }
                }}
                className={`block ${hasStories || isOwnProfile ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div
                  className="rounded-2xl p-[3px]"
                  style={{
                    background: hasStories
                      ? hasUnviewedStories
                        ? 'conic-gradient(from var(--profile-ring-angle), #e8883a 0%, #f59e0b 25%, #ef4444 50%, #f59e0b 75%, #e8883a 100%)'
                        : 'rgba(255,255,255,0.18)'
                      : 'transparent',
                    animation:
                      hasStories && hasUnviewedStories
                        ? 'profile-ring-spin 4s linear infinite'
                        : 'none',
                  }}
                >
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[13px] bg-card shadow-2xl shadow-black/30 flex items-center justify-center text-primary font-bold text-4xl sm:text-5xl overflow-hidden">
                    {displayUser?.avatar ? (
                      <img
                        src={displayUser.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/25 to-violet-500/10" />
                        <span className="relative">
                          {displayUser?.name?.charAt(0) || 'A'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </button>
              {displayUser?.verified && (
                <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-primary rounded-xl flex items-center justify-center border-[3px] border-background shadow-lg shadow-primary/20 z-10">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
              )}
              {/* Level badge */}
              <div className="absolute -top-2 -right-2 w-9 h-9 bg-card border-2 border-primary/60 rounded-xl flex items-center justify-center shadow-lg z-10">
                <span className="text-primary font-black text-xs">
                  Lv{displayUser?.sellerLevel || 1}
                </span>
              </div>
            </motion.div>

            {/* Name & Meta */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex-1 min-w-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                      {displayUser?.name || 'User'}
                    </h1>
                    <VerificationBadge
                      verified={
                        publicStats?.verification?.verified ??
                        displayUser?.verified
                      }
                      proSeller={publicStats?.verification?.proSeller}
                      topRated={publicStats?.verification?.topRated}
                      kycVerified={publicStats?.verification?.kycVerified}
                    />
                  </div>
                  <p className="text-muted text-sm mt-0.5">
                    @{displayUser?.username || params.username}
                  </p>
                  {displayUser?.bio && (
                    <p className="text-foreground/70 text-sm mt-2.5 max-w-md leading-relaxed">
                      {displayUser?.bio}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-[12px] text-muted">
                    {displayUser?.location && (
                      <span className="flex items-center gap-1 bg-surface px-2.5 py-1 rounded-lg">
                        <MapPin size={11} className="text-muted/50" />
                        {displayUser?.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1 bg-surface px-2.5 py-1 rounded-lg">
                      <Calendar size={11} className="text-muted/50" />
                      {t('profile.joined')} 2024
                    </span>
                    {displayUser?.socialLinks?.instagram && (
                      <a
                        href="#"
                        className="flex items-center gap-1 bg-surface px-2.5 py-1 rounded-lg hover:text-pink-400 transition-colors"
                      >
                        <Instagram size={11} />
                        {displayUser?.socialLinks?.instagram}
                      </a>
                    )}
                    {displayUser?.socialLinks?.website && (
                      <a
                        href="#"
                        className="flex items-center gap-1 bg-surface px-2.5 py-1 rounded-lg hover:text-blue-400 transition-colors"
                      >
                        <Globe size={11} />
                        {t('profile.website')}
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isOwnProfile ? (
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all bg-surface/40 backdrop-blur-sm"
                    >
                      <Edit3 size={13} />
                      {t('profile.editProfile')}
                    </Link>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsFollowing(!isFollowing)}
                        className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          isFollowing
                            ? 'border border-border/60 text-foreground hover:border-red-400/40 hover:text-red-400 bg-surface/40'
                            : 'bg-primary text-white shadow-[0_0_20px_rgba(232,136,58,0.2)] hover:shadow-[0_0_30px_rgba(232,136,58,0.3)]'
                        }`}
                      >
                        {isFollowing ? (
                          <UserCheck size={14} />
                        ) : (
                          <UserPlus size={14} />
                        )}
                        {isFollowing
                          ? t('profile.following')
                          : t('profile.follow')}
                      </button>
                      {isAuthenticated && profileUser?.id && (
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/messages?seller=${profileUser.id}`
                            )
                          }
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-border/60 hover:border-primary/40 hover:text-primary text-foreground bg-surface/40 transition-all"
                        >
                          <MessageCircle size={14} />
                          {t('profile.message')}
                        </button>
                      )}
                      <button className="p-2.5 rounded-xl border border-border/60 hover:bg-surface text-muted hover:text-foreground transition-all">
                        <Share2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ─── STATS ROW ─── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8"
        >
          {[
            {
              key: 'followers',
              label: t('profile.followers'),
              value: displayUser?.followers?.toLocaleString() || '0',
              icon: Users,
              color: 'text-blue-400',
              bgColor: 'bg-blue-400/10',
              borderColor: 'border-blue-400/15',
            },
            {
              key: 'following',
              label: t('profile.followingCount'),
              value: (displayUser?.following || 0).toString(),
              icon: UserPlus,
              color: 'text-violet-400',
              bgColor: 'bg-violet-400/10',
              borderColor: 'border-violet-400/15',
            },
            {
              key: 'totalSales',
              label: t('profile.totalSales'),
              value: sellerStats.totalSales.toString(),
              icon: Package,
              color: 'text-emerald-400',
              bgColor: 'bg-emerald-400/10',
              borderColor: 'border-emerald-400/15',
            },
            {
              key: 'rating',
              label: t('profile.rating'),
              value:
                sellerStats.totalSales > 0
                  ? sellerStats.sellerRating.toString()
                  : '—',
              icon: Star,
              color: 'text-amber-400',
              bgColor: 'bg-amber-400/10',
              borderColor: 'border-amber-400/15',
              isStar: true,
            },
            {
              key: 'avgShip',
              label: t('profile.avgShip'),
              value: sellerStats.avgShipTime,
              icon: Clock,
              color: 'text-primary',
              bgColor: 'bg-primary/10',
              borderColor: 'border-primary/15',
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 + i * 0.05 }}
                className={`bg-card rounded-2xl border ${stat.borderColor} p-4 ${stat.key === 'avgShip' ? 'hidden sm:block' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg ${stat.bgColor} ${stat.color} flex items-center justify-center`}
                  >
                    <Icon
                      size={13}
                      className={stat.isStar ? 'fill-amber-400' : ''}
                    />
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground tracking-tight">
                  {stat.value}
                </p>
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mt-0.5">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ─── SELLER LEVEL BAR ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="bg-card rounded-2xl border border-primary/15 p-5 mb-8 relative overflow-hidden"
        >
          {/* Subtle gradient bg */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.04] to-transparent pointer-events-none" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Shield size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {t('profile.sellerLevel', {
                    level: displayUser?.sellerLevel || 1,
                  })}
                </p>
                <div className="flex gap-1 mt-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-2 rounded-full transition-all ${
                        i <= (displayUser?.sellerLevel || 1)
                          ? 'w-10 bg-primary shadow-[0_0_8px_rgba(232,136,58,0.3)]'
                          : 'w-10 bg-white/[0.06]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-[12px]">
              <span className="flex items-center gap-1.5 text-muted">
                <Clock size={12} className="text-muted/50" />
                <span className="font-semibold text-foreground">
                  {sellerStats.avgShipTime}
                </span>{' '}
                {t('profile.avgShipLabel')}
              </span>
              <span className="w-px h-4 bg-white/[0.06]" />
              <span className="flex items-center gap-1.5 text-muted">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span className="font-semibold text-foreground">
                  {sellerStats.completionRate}%
                </span>{' '}
                {t('profile.completion')}
              </span>
              <span className="w-px h-4 bg-white/[0.06]" />
              <span className="flex items-center gap-1.5 text-muted">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="font-semibold text-foreground">
                  {sellerStats.totalSales > 0 ? sellerStats.sellerRating : '—'}
                </span>{' '}
                {t('profile.ratingLabel')}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ─── STORIES BAR ─── */}
        <div className="mb-8">
          <StoriesBar />
        </div>

        {/* ─── TABS ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex gap-1 mb-8 p-1 bg-surface/60 rounded-xl border border-border/60 w-fit backdrop-blur-sm"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-[0_0_15px_rgba(232,136,58,0.15)]'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  activeTab === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-surface text-muted/70'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </motion.div>

        {/* ─── TAB CONTENT ─── */}
        <div className="pb-12">
          <AnimatePresence mode="wait">
            {/* SELLING TAB */}
            {activeTab === 'selling' && (
              <motion.div
                key="selling"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {activeListings.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-border py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                      <Tag size={24} className="text-muted/30" />
                    </div>
                    <p className="text-foreground font-medium">
                      {t('profile.noActiveListings')}
                    </p>
                    <p className="text-sm text-muted mt-1">
                      {t('profile.noActiveListingsDesc')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeListings.map((listing, i) => (
                      <Link
                        key={listing.id}
                        href={`/products/${listing.productId}`}
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.05 }}
                          className="bg-card rounded-2xl border border-border overflow-hidden group cursor-pointer hover:border-border-hover transition-all"
                        >
                          <div className="aspect-square bg-surface relative flex items-center justify-center text-muted/20 overflow-hidden">
                            {listing.productImage ? (
                              <img
                                src={listing.productImage}
                                alt={listing.productName}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            ) : (
                              <Package size={48} />
                            )}
                            {/* Condition badge */}
                            <div className="absolute top-3 right-3">
                              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-white border border-white/10">
                                {listing.condition === 'new'
                                  ? t('profile.conditionNew')
                                  : t('profile.conditionUsed')}
                              </span>
                            </div>
                            {/* Views */}
                            <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-white/70 text-[10px]">
                              <Eye size={10} />
                              {listing.views}
                            </div>
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-primary/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>

                          <div className="p-4">
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {listing.productName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              {listing.size && (
                                <span className="text-[11px] text-muted bg-surface px-1.5 py-0.5 rounded">
                                  {listing.size}
                                </span>
                              )}
                              <span className="text-[11px] text-muted capitalize">
                                {listing.category}
                              </span>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
                              <div>
                                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                                  {t('profile.ask')}
                                </p>
                                <p className="text-lg font-bold text-primary">
                                  {formatPrice(listing.askPrice)}
                                </p>
                              </div>
                              {listing.lastSale && (
                                <div className="text-right">
                                  <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                                    {t('profile.lastSale')}
                                  </p>
                                  <p className="text-sm font-semibold text-foreground/70">
                                    {formatPrice(listing.lastSale)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* FEEDBACK TAB */}
            {activeTab === 'feedback' && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 max-w-2xl"
              >
                {feedbackItems.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-border py-16 text-center">
                    <Star size={28} className="mx-auto text-muted/20 mb-3" />
                    <p className="text-foreground font-medium">
                      {t('profile.noFeedback')}
                    </p>
                    <p className="text-sm text-muted mt-1">
                      {t('profile.noFeedbackDesc')}
                    </p>
                  </div>
                ) : (
                  feedbackItems.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="bg-card rounded-2xl border border-border p-5"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center text-foreground text-xs font-bold">
                          {item.buyer.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-foreground">
                            {item.buyer}
                          </span>
                          <div className="flex gap-0.5 mt-0.5">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star
                                key={j}
                                size={10}
                                className={
                                  j < item.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-white/[0.06]'
                                }
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      {item.title && (
                        <h4 className="text-sm font-semibold text-foreground mt-2">
                          {item.title}
                        </h4>
                      )}
                      <p className="text-sm text-muted mt-1 leading-relaxed">
                        {item.comment}
                      </p>
                      <p className="text-[11px] text-muted/50 mt-2">
                        {item.date}
                      </p>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {/* FAVORITES TAB */}
            {activeTab === 'favorites' && (
              <motion.div
                key="favorites"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {favorites.map((item, i) => {
                  const isUp = item.priceChange >= 0;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="bg-card rounded-2xl border border-border overflow-hidden group cursor-pointer hover:border-border-hover transition-all"
                    >
                      <div className="aspect-[4/3] bg-surface relative flex items-center justify-center text-muted/20">
                        <Heart size={36} />
                        <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-rose-500/80 backdrop-blur-sm flex items-center justify-center">
                          <Heart size={12} className="text-white fill-white" />
                        </div>
                        {/* Price change badge */}
                        <div className="absolute bottom-3 left-3">
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-sm border ${
                              isUp
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/20'
                                : 'bg-red-500/20 text-red-300 border-red-400/20'
                            }`}
                          >
                            {isUp ? (
                              <TrendingUp size={9} />
                            ) : (
                              <TrendingDown size={9} />
                            )}
                            {isUp ? '+' : ''}
                            {item.priceChange}%
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-muted capitalize mt-0.5">
                          {item.category.replace('-', ' ')}
                        </p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
                          <div>
                            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                              {t('profile.lowestAsk')}
                            </p>
                            <p className="text-sm font-bold text-emerald-400">
                              {formatPrice(item.lowestAsk)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                              {t('profile.lastSale')}
                            </p>
                            <p className="text-sm font-semibold text-foreground/70">
                              {formatPrice(item.lastSale)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* COLLECTION TAB */}
            {activeTab === 'collection' && (
              <motion.div
                key="collection"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Collection summary */}
                <div className="bg-card rounded-2xl border border-violet-400/15 p-5 mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-400/[0.04] to-transparent pointer-events-none" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-violet-400/10 text-violet-400 flex items-center justify-center">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                          {t('profile.collectionValue')}
                        </p>
                        <p className="text-2xl font-bold text-foreground tracking-tight">
                          {formatPrice(totalCollectionValue)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                        {t('profile.items')}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {portfolio.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portfolio.map((item, i) => {
                    const isUp = item.gainLoss >= 0;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="bg-card rounded-2xl border border-border overflow-hidden group cursor-pointer hover:border-border-hover transition-all"
                      >
                        <div className="aspect-square bg-surface relative flex items-center justify-center text-muted/20">
                          <Briefcase size={40} />
                          {/* Gain/loss badge */}
                          <div className="absolute top-3 right-3">
                            <span
                              className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-sm border ${
                                isUp
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/20'
                                  : 'bg-red-500/20 text-red-300 border-red-400/20'
                              }`}
                            >
                              {isUp ? '+' : ''}
                              {item.gainLossPercent}%
                            </span>
                          </div>
                          {/* Condition */}
                          <div className="absolute bottom-3 left-3">
                            <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-white/70 border border-white/10">
                              {item.condition}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {item.productName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {item.size && (
                              <span className="text-[11px] text-muted bg-surface px-1.5 py-0.5 rounded">
                                {item.size}
                              </span>
                            )}
                            <span className="text-[11px] text-muted capitalize">
                              {item.category}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
                            <div>
                              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                                {t('profile.value')}
                              </p>
                              <p className="text-sm font-bold text-foreground">
                                {formatPrice(item.currentValue)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                                {t('profile.gainLoss')}
                              </p>
                              <p
                                className={`text-sm font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}
                              >
                                {isUp ? '+' : '-'}
                                {formatPrice(Math.abs(item.gainLoss))}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
            {/* TERMS TAB */}
            {activeTab === 'terms' && (
              <motion.div
                key="terms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-card rounded-2xl border border-border overflow-hidden max-w-3xl">
                  <div className="px-6 py-5 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <FileText size={16} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">
                          {t('profile.sellerTermsTitle')}
                        </h3>
                        <p className="text-[11px] text-muted mt-0.5">
                          {t('profile.sellerTermsUpdated')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {sellerTerms.map((section, i) => (
                      <div key={i} className="px-6 py-5">
                        <h4 className="text-sm font-semibold text-foreground mb-2">
                          {section.title}
                        </h4>
                        <p className="text-sm text-muted leading-relaxed">
                          {section.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
