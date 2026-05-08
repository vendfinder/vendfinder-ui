'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Users,
  UserPlus,
  UserCheck,
  Star,
  MapPin,
  Loader2,
  X,
  TrendingUp,
  Crown,
  Verified,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import type { ApiUser } from '@/lib/api-users';

interface SearchableUser extends ApiUser {
  isFollowing?: boolean;
  mutualFollowers?: number;
}

interface UserSearchProps {
  isOpen?: boolean;
  onClose?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}

export default function UserSearch({
  isOpen = true,
  onClose,
  autoFocus = false,
  placeholder = "Search for creators, sellers, and collectors..."
}: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchableUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchableUser[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SearchableUser[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user: currentUser, token } = useAuth();
  const router = useRouter();

  // Auto-focus input when component mounts or opens
  useEffect(() => {
    if ((autoFocus || isOpen) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus, isOpen]);

  // Fetch suggested users on mount
  useEffect(() => {
    fetchSuggestedUsers();
    loadRecentSearches();
  }, []);

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query.trim());
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const fetchSuggestedUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/users/suggested', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestedUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch suggested users:', error);
    }
  };

  const loadRecentSearches = () => {
    const stored = localStorage.getItem('vendfinder-recent-searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        // Ignore invalid JSON
      }
    }
  };

  const saveRecentSearch = (user: SearchableUser) => {
    const recent = recentSearches.filter(u => u.id !== user.id);
    const updated = [user, ...recent].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('vendfinder-recent-searches', JSON.stringify(updated));
  };

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '20'
      });

      const res = await fetch(`/api/users/search?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.users || []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserClick = (user: SearchableUser) => {
    saveRecentSearch(user);
    router.push(`/profile/${user.username}`);
    if (onClose) onClose();
  };

  const handleFollowToggle = async (user: SearchableUser, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token || !currentUser) return;

    try {
      const endpoint = user.isFollowing ? 'unfollow' : 'follow';
      const method = user.isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`/api/users/${user.id}/${endpoint}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        // Update the user in all relevant states
        const updateUser = (u: SearchableUser) =>
          u.id === user.id ? { ...u, isFollowing: !u.isFollowing } : u;

        setResults(prev => prev.map(updateUser));
        setSuggestedUsers(prev => prev.map(updateUser));
        setRecentSearches(prev => prev.map(updateUser));
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('vendfinder-recent-searches');
  };

  const displayUsers = hasSearched ? results : [];
  const showSuggested = !hasSearched && !query.trim() && suggestedUsers.length > 0;
  const showRecent = !hasSearched && !query.trim() && recentSearches.length > 0;

  const UserCard = ({ user, showMutuals = false }: { user: SearchableUser; showMutuals?: boolean }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group cursor-pointer"
      onClick={() => handleUserClick(user)}
    >
      <div className="flex items-center gap-3 p-4 rounded-2xl hover:bg-surface/60 transition-all duration-200 group-hover:scale-[1.01]">
        {/* Avatar with story ring effect */}
        <div className="relative shrink-0">
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

        {/* User info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-foreground truncate">
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

          {/* Mutual followers */}
          {showMutuals && user.mutualFollowers && user.mutualFollowers > 0 && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted">
              <Users size={10} />
              <span>{user.mutualFollowers} mutual</span>
            </div>
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
        </div>

        {/* Follow button */}
        {currentUser && currentUser.id !== user.id && (
          <button
            onClick={(e) => handleFollowToggle(user, e)}
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-2xl mx-auto bg-card border border-border rounded-3xl shadow-2xl shadow-black/20 overflow-hidden"
    >
      {/* Header */}
      <div className="relative p-6 border-b border-border/50">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] to-violet-500/[0.02]" />

        <div className="relative flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/50" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-12 pr-4 py-4 bg-surface/60 border border-border/60 rounded-2xl text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all backdrop-blur-sm"
            />

            {/* Loading indicator */}
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 size={16} className="animate-spin text-primary" />
              </div>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-h-96 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Search Results */}
          {hasSearched && (
            <motion.div
              key="search-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {displayUsers.length > 0 ? (
                <div className="p-2">
                  <div className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">
                    {displayUsers.length} result{displayUsers.length !== 1 ? 's' : ''}
                  </div>
                  {displayUsers.map((user) => (
                    <UserCard key={user.id} user={user} showMutuals />
                  ))}
                </div>
              ) : isSearching ? (
                <div className="p-8 text-center">
                  <Loader2 size={24} className="animate-spin text-primary mx-auto mb-2" />
                  <p className="text-muted">Searching...</p>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Users size={32} className="text-muted/30 mx-auto mb-3" />
                  <p className="font-medium text-foreground">No users found</p>
                  <p className="text-sm text-muted mt-1">Try searching with different keywords</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Recent Searches */}
          {showRecent && (
            <motion.div
              key="recent-searches"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-2"
            >
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-muted hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </motion.div>
          )}

          {/* Suggested Users */}
          {showSuggested && (
            <motion.div
              key="suggested-users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-2"
            >
              <div className="flex items-center gap-2 px-4 py-2">
                <TrendingUp size={14} className="text-primary" />
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Suggested for You
                </span>
              </div>
              {suggestedUsers.map((user) => (
                <UserCard key={user.id} user={user} showMutuals />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}