'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  UserCheck,
  ArrowLeft,
  Search,
  Loader2,
  Star,
  MapPin,
  Crown,
  Verified,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchUserByUsername, type ApiUser } from '@/lib/api-users';
import type { User } from '@/types';

interface FollowUser extends ApiUser {
  isFollowing?: boolean;
  mutualFollowers?: number;
}

type TabType = 'followers' | 'following';

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

export default function FollowersPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, isAuthenticated, token } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('followers');
  const [profileUser, setProfileUser] = useState<Partial<User> | null>(null);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<FollowUser[]>([]);

  const username = params.username as string;
  const isOwnProfile = currentUser?.username === username;

  // Handle tab from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab') as TabType;
    if (tab && (tab === 'followers' || tab === 'following')) {
      setActiveTab(tab);
    }
  }, []);

  // Fetch profile user data
  useEffect(() => {
    if (!username) return;

    fetchUserByUsername(username).then(({ user: fetchedUser }) => {
      if (fetchedUser) {
        setProfileUser(apiUserToProfileUser(fetchedUser));
      }
    });
  }, [username]);

  // Define fetch functions first
  const fetchFollowersData = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/followers`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setFollowers(data.followers || []);
      }
    } catch (error) {
      // Use mock data for development
      setFollowers(getMockUsers('followers'));
    }
  };

  const fetchFollowingData = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/following`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setFollowing(data.following || []);
      }
    } catch (error) {
      // Use mock data for development
      setFollowing(getMockUsers('following'));
    }
  };

  // Fetch followers and following data
  useEffect(() => {
    if (!profileUser?.id) return;

    setIsLoading(true);
    Promise.all([
      fetchFollowersData(profileUser.id),
      fetchFollowingData(profileUser.id)
    ]).finally(() => setIsLoading(false));
  }, [profileUser?.id, fetchFollowersData, fetchFollowingData]);

  // Filter users based on search
  useEffect(() => {
    const users = activeTab === 'followers' ? followers : following;
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(query) ||
      user.displayName?.toLowerCase().includes(query) ||
      user.bio?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [activeTab, followers, following, searchQuery]);

  const handleFollowToggle = async (user: FollowUser) => {
    if (!token || !currentUser || !isAuthenticated) return;

    try {
      const endpoint = user.isFollowing ? 'unfollow' : 'follow';
      const res = await fetch(`/api/users/${user.id}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const updateUser = (u: FollowUser) =>
          u.id === user.id ? { ...u, isFollowing: !u.isFollowing } : u;

        setFollowers(prev => prev.map(updateUser));
        setFollowing(prev => prev.map(updateUser));
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  const UserCard = ({ user }: { user: FollowUser }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group"
    >
      <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface/60 transition-all duration-200 group-hover:scale-[1.01]">
        {/* Avatar */}
        <Link href={`/profile/${user.username}`} className="shrink-0">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface border border-border/60 group-hover:border-primary/30 transition-all">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center text-primary font-bold text-lg">
                  {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
                </div>
              )}
            </div>

            {/* Level badge */}
            {user.sellerLevel && user.sellerLevel > 1 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-lg flex items-center justify-center text-white text-[9px] font-black border-2 border-background">
                {user.sellerLevel}
              </div>
            )}
          </div>
        </Link>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${user.username}`} className="block">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground truncate hover:text-primary transition-colors">
                {user.displayName || user.username}
              </h3>

              {/* Verification badges */}
              {user.verified && (
                <Verified size={14} className="text-blue-500 fill-blue-500 shrink-0" />
              )}

              {user.sellerLevel && user.sellerLevel >= 4 && (
                <Crown size={14} className="text-amber-500 fill-amber-500 shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-muted">@{user.username}</span>

              {user.location && (
                <>
                  <span className="text-muted">•</span>
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <MapPin size={10} />
                    <span>{user.location}</span>
                  </div>
                </>
              )}
            </div>

            {/* Bio snippet */}
            {user.bio && (
              <p className="text-xs text-muted/80 mt-1 line-clamp-1">
                {user.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
              {user.followersCount !== undefined && (
                <span>{user.followersCount.toLocaleString()} followers</span>
              )}
              {user.sellerLevel && user.sellerLevel > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Star size={10} className="text-amber-500" />
                    <span>Level {user.sellerLevel}</span>
                  </div>
                </>
              )}
            </div>
          </Link>
        </div>

        {/* Follow button */}
        {currentUser && currentUser.id !== user.id && (
          <button
            onClick={() => handleFollowToggle(user)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              user.isFollowing
                ? 'bg-surface border border-border text-muted hover:border-red-400/40 hover:text-red-400 hover:bg-red-500/5'
                : 'bg-primary text-white hover:bg-primary-dark shadow-lg hover:shadow-xl hover:shadow-primary/20'
            }`}
          >
            {user.isFollowing ? (
              <UserCheck size={14} />
            ) : (
              <UserPlus size={14} />
            )}
          </button>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-surface border border-border hover:bg-surface/80 transition-all"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {profileUser?.name || username}
            </h1>
            <p className="text-muted">@{username}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 bg-surface/60 rounded-xl border border-border/60 w-fit backdrop-blur-sm">
          {[
            { key: 'followers' as const, label: `${profileUser?.followers || 0} Followers` },
            { key: 'following' as const, label: `${profileUser?.following || 0} Following` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-[0_0_15px_rgba(232,136,58,0.15)]'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-12 pr-4 py-3 bg-surface/60 border border-border/60 rounded-xl text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
        </div>

        {/* Content */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 size={32} className="animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted">Loading {activeTab}...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="divide-y divide-border/50">
              {filteredUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users size={48} className="text-muted/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No {activeTab} {searchQuery ? 'found' : 'yet'}
              </h3>
              <p className="text-muted">
                {searchQuery
                  ? `No ${activeTab} match your search.`
                  : isOwnProfile
                  ? `Start connecting with other users to build your ${activeTab} list.`
                  : `${profileUser?.name} hasn't ${activeTab === 'followers' ? 'gained any followers' : 'followed anyone'} yet.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mock data for development
function getMockUsers(type: 'followers' | 'following'): FollowUser[] {
  const users: FollowUser[] = [
    {
      id: 'mock1',
      username: 'sneaker_queen',
      displayName: 'Jessica Martinez',
      email: 'jessica@example.com',
      role: 'seller',
      bio: 'Rare sneaker collector. Jordan specialist. Authentic guaranteed.',
      location: 'Miami, FL',
      verified: true,
      sellerLevel: 4,
      followersCount: 5234,
      followingCount: 892,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      isFollowing: Math.random() > 0.5,
      mutualFollowers: Math.floor(Math.random() * 20)
    },
    {
      id: 'mock2',
      username: 'vintage_collector',
      displayName: 'Alex Chen',
      email: 'alex@example.com',
      role: 'buyer',
      bio: 'Vintage fashion enthusiast. 90s and Y2K specialist.',
      location: 'San Francisco, CA',
      verified: false,
      sellerLevel: 2,
      followersCount: 1456,
      followingCount: 2341,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      isFollowing: Math.random() > 0.5,
      mutualFollowers: Math.floor(Math.random() * 15)
    },
    {
      id: 'mock3',
      username: 'hypebeast_hunter',
      displayName: 'Marcus Johnson',
      email: 'marcus@example.com',
      role: 'buyer',
      bio: 'Always hunting for the latest drops. Supreme, Off-White, Travis Scott.',
      location: 'New York, NY',
      verified: true,
      sellerLevel: 3,
      followersCount: 3421,
      followingCount: 567,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      isFollowing: Math.random() > 0.5,
      mutualFollowers: Math.floor(Math.random() * 10)
    }
  ];

  return users.slice(0, type === 'followers' ? 2 : 3);
}