import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@vendfinder/shared";
import { getItem, setItem, removeItem } from "@/lib/storage";
import { loginUser, registerUser, AuthResponse } from "@/lib/api-auth";
import { updateUserProfile, ProfileUpdateData } from "@/lib/api-users";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Map API auth response user to shared User type */
function mapApiUser(apiUser: NonNullable<AuthResponse["user"]>): User {
  return {
    id: apiUser.id,
    name: apiUser.displayName || apiUser.username || "",
    email: apiUser.email,
    username: apiUser.username,
    avatar: apiUser.avatarUrl,
    bio: apiUser.bio,
    location: apiUser.location,
    joinedDate: apiUser.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0],
    sellerLevel: apiUser.sellerLevel,
    verified: apiUser.verified,
    following: apiUser.followingCount,
    followers: apiUser.followersCount,
    profileViews: apiUser.profileViews,
    socialLinks: {
      instagram: apiUser.socialInstagram,
      twitter: apiUser.socialTwitter,
      website: apiUser.socialWebsite,
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Restore saved session on mount
  useEffect(() => {
    Promise.all([
      getItem<User>("vendfinder-user"),
      getItem<string>("vendfinder-token"),
    ]).then(([storedUser, storedToken]) => {
      if (storedUser && storedToken) {
        setUser(storedUser);
        setToken(storedToken);
      }
      setLoaded(true);
    });
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await loginUser(email, password);
      if (res.error || !res.token || !res.user) return false;

      const mappedUser = mapApiUser(res.user);
      setUser(mappedUser);
      setToken(res.token);
      await setItem("vendfinder-user", mappedUser);
      await setItem("vendfinder-token", res.token);
      return true;
    } catch {
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await registerUser(name, email, password);
      if (res.error || !res.token || !res.user) return false;

      const mappedUser = mapApiUser(res.user);
      setUser(mappedUser);
      setToken(res.token);
      await setItem("vendfinder-user", mappedUser);
      await setItem("vendfinder-token", res.token);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await removeItem("vendfinder-user");
    await removeItem("vendfinder-token");
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user || !token) return;

    // Optimistic local update
    const updated = { ...user, ...updates };
    setUser(updated);
    await setItem("vendfinder-user", updated);

    // Sync to backend
    try {
      const apiData: ProfileUpdateData = {};
      if (updates.name) apiData.displayName = updates.name;
      if (updates.bio) apiData.bio = updates.bio;
      if (updates.location) apiData.location = updates.location;
      if (updates.avatar) apiData.avatarUrl = updates.avatar;
      if (updates.socialLinks?.instagram) apiData.socialInstagram = updates.socialLinks.instagram;
      if (updates.socialLinks?.twitter) apiData.socialTwitter = updates.socialLinks.twitter;
      if (updates.socialLinks?.website) apiData.socialWebsite = updates.socialLinks.website;

      if (Object.keys(apiData).length > 0) {
        await updateUserProfile(user.id, apiData, token);
      }
    } catch {
      // Revert on failure
      setUser(user);
      await setItem("vendfinder-user", user);
    }
  };

  if (!loaded) return null;

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!user && !!token, login, signup, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
