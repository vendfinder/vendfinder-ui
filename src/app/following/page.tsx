'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserMinus, Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  bio?: string;
}

interface FollowingResponse {
  following: User[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export default function FollowingPage() {
  const { user, isAuthenticated, token } = useAuth();
  const router = useRouter();
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowingIds, setUnfollowingIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0 });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/following');
    }
  }, [isAuthenticated, router]);

  // Load following list
  useEffect(() => {
    if (!user?.id || !token) return;

    const loadFollowing = async () => {
      try {
        const response = await fetch(`/api/users/${user.id}/following`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data: FollowingResponse = await response.json();
          setFollowing(data.following.map(u => ({
            ...u,
            displayName: u.displayName || u.username,
          })));
          setStats({ total: data.total });
        }
      } catch (error) {
        console.error('Failed to load following:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFollowing();
  }, [user?.id, token]);

  const handleUnfollow = async (userId: string) => {
    if (!user?.id || !token || unfollowingIds.has(userId)) return;

    setUnfollowingIds(prev => new Set(prev).add(userId));

    try {
      const response = await fetch(`/api/users/${userId}/unfollow`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setFollowing(prev => prev.filter(u => u.id !== userId));
        setStats(prev => ({ total: prev.total - 1 }));
      }
    } catch (error) {
      console.error('Failed to unfollow:', error);
    } finally {
      setUnfollowingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Filter following based on search term
  const filteredFollowing = following.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/discover"
              className="p-2 hover:bg-surface rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-muted" />
            </Link>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Users size={28} className="text-primary" />
                Following
              </h1>
              <p className="text-muted mt-1">
                {stats.total} {stats.total === 1 ? 'user' : 'users'} you follow
              </p>
            </div>
          </div>

          {/* Search */}
          {following.length > 0 && (
            <div className="mt-6">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search following..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted transition-all"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : following.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-muted" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No one followed yet
            </h2>
            <p className="text-muted mb-6">
              Start building your network by discovering and following sellers and collectors.
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all"
            >
              <Search size={20} />
              Discover Users
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredFollowing.length === 0 && searchTerm ? (
              <div className="text-center py-8">
                <p className="text-muted">
                  No users found matching "{searchTerm}"
                </p>
              </div>
            ) : (
              filteredFollowing.map((followingUser, index) => (
                <motion.div
                  key={followingUser.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-card rounded-xl border border-border p-4 hover:border-border-hover transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface border border-border">
                        {followingUser.avatarUrl ? (
                          <img
                            src={followingUser.avatarUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center text-primary font-bold text-lg">
                            {followingUser.displayName?.charAt(0) || followingUser.username?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      {followingUser.verified && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/profile/${followingUser.username}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors truncate"
                        >
                          {followingUser.displayName}
                        </Link>
                        {followingUser.username !== followingUser.displayName && (
                          <span className="text-muted text-sm truncate">
                            @{followingUser.username}
                          </span>
                        )}
                      </div>

                      {followingUser.bio && (
                        <p className="text-muted text-sm mt-1 line-clamp-2">
                          {followingUser.bio}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                        <span>{followingUser.followersCount} followers</span>
                        <span>{followingUser.followingCount} following</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile/${followingUser.username}`}
                        className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:border-primary hover:text-primary transition-all"
                      >
                        View Profile
                      </Link>
                      <button
                        onClick={() => handleUnfollow(followingUser.id)}
                        disabled={unfollowingIds.has(followingUser.id)}
                        className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Unfollow"
                      >
                        {unfollowingIds.has(followingUser.id) ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                        ) : (
                          <UserMinus size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}