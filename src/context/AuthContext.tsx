'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { User } from '@/types';
import {
  loginUser,
  registerUser,
  oauthLogin,
  AuthResponse,
} from '@/lib/api-auth';
import { updateUserProfile, ProfileUpdateData, ApiUser } from '@/lib/api-users';

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<AuthResult>;
  loginWithOAuth: (
    provider: 'google' | 'apple',
    token: string,
    name?: string
  ) => Promise<AuthResult>;
  logout: () => void;
  updateProfile: (updates: ProfileUpdateData) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Map API user response to frontend User type
function apiUserToUser(u: NonNullable<AuthResponse['user']> | ApiUser): User {
  return {
    id: u.id,
    name:
      u.displayName || u.username || (u.email ? u.email.split('@')[0] : 'User'),
    email: u.email || '',
    avatar: u.avatarUrl || undefined,
    banner: u.bannerUrl || undefined,
    joinedDate: u.createdAt
      ? u.createdAt.split('T')[0]
      : new Date().toISOString().split('T')[0],
    username: u.username,
    bio: u.bio || undefined,
    location: u.location || undefined,
    sellerLevel: u.sellerLevel ?? 0,
    verified: u.verified ?? false,
    following: u.followingCount ?? 0,
    followers: u.followersCount ?? 0,
    profileViews: u.profileViews ?? 0,
    socialLinks: {
      instagram: u.socialInstagram || undefined,
      twitter: u.socialTwitter || undefined,
      website: u.socialWebsite || undefined,
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Rehydrate user from token on mount
  const rehydrate = useCallback(async () => {
    const token = localStorage.getItem('vendfinder-token');
    const storedUser = localStorage.getItem('vendfinder-user');

    if (!token) {
      setLoaded(true);
      return;
    }

    setAuthToken(token);

    // Show stored user immediately while we fetch fresh data
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // ignore bad JSON
      }
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const freshUser = apiUserToUser(data);
        setUser(freshUser);
        localStorage.setItem('vendfinder-user', JSON.stringify(freshUser));
      } else if (res.status === 401 || res.status === 403) {
        // Token expired or account disabled — log out
        localStorage.removeItem('vendfinder-user');
        localStorage.removeItem('vendfinder-token');
        setUser(null);
      }
    } catch {
      // Network error — keep using stored user
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    rehydrate();
  }, [rehydrate]);

  const login = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      const res = await loginUser(email, password);
      if (res.error || !res.user) {
        return { success: false, error: res.error || 'Login failed' };
      }
      const loggedInUser = apiUserToUser(res.user);
      setUser(loggedInUser);
      localStorage.setItem('vendfinder-user', JSON.stringify(loggedInUser));
      if (res.token) {
        localStorage.setItem('vendfinder-token', res.token);
        setAuthToken(res.token);
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Unable to connect to server' };
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      const res = await registerUser(name, email, password);
      if (res.error || !res.user) {
        return { success: false, error: res.error || 'Registration failed' };
      }
      const newUser = apiUserToUser(res.user);
      setUser(newUser);
      localStorage.setItem('vendfinder-user', JSON.stringify(newUser));
      if (res.token) {
        localStorage.setItem('vendfinder-token', res.token);
        setAuthToken(res.token);
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Unable to connect to server' };
    }
  };

  const loginWithOAuth = async (
    provider: 'google' | 'apple',
    token: string,
    name?: string
  ): Promise<AuthResult> => {
    try {
      const res = await oauthLogin(provider, token, name);
      if (res.error || !res.user) {
        return { success: false, error: res.error || 'OAuth login failed' };
      }
      const oauthUser = apiUserToUser(res.user);
      setUser(oauthUser);
      localStorage.setItem('vendfinder-user', JSON.stringify(oauthUser));
      if (res.token) {
        localStorage.setItem('vendfinder-token', res.token);
        setAuthToken(res.token);
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Unable to connect to server' };
    }
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('vendfinder-user');
    localStorage.removeItem('vendfinder-token');
  };

  const updateProfileFn = async (
    updates: ProfileUpdateData
  ): Promise<AuthResult> => {
    if (!user) return { success: false, error: 'Not authenticated' };
    const token = localStorage.getItem('vendfinder-token');
    if (!token) return { success: false, error: 'Not authenticated' };

    const result = await updateUserProfile(user.id, updates, token);
    if (result.error) {
      return { success: false, error: result.error };
    }
    if (result.user) {
      const updated = apiUserToUser(result.user);
      // Preserve email since public profile endpoint strips it
      if (!updated.email && user.email) updated.email = user.email;
      setUser(updated);
      localStorage.setItem('vendfinder-user', JSON.stringify(updated));
    }
    return { success: true };
  };

  if (!loaded) return null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token: authToken,
        isAuthenticated: !!user,
        login,
        signup,
        loginWithOAuth,
        logout,
        updateProfile: updateProfileFn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
