"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USER: User = {
  id: "user-1",
  name: "Alex Johnson",
  email: "alex@example.com",
  username: "alexj",
  bio: "Sneaker enthusiast & streetwear collector. Always hunting for the next grail. Based in NYC.",
  location: "New York, NY",
  joinedDate: "2024-06-01",
  sellerLevel: 3,
  verified: true,
  following: 128,
  followers: 847,
  profileViews: 2340,
  socialLinks: {
    instagram: "alexj_kicks",
    twitter: "alexj_style",
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("vendfinder-user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoaded(true);
  }, []);

  const login = (email: string, _password: string): boolean => {
    const loggedInUser = { ...MOCK_USER, email };
    setUser(loggedInUser);
    localStorage.setItem("vendfinder-user", JSON.stringify(loggedInUser));
    return true;
  };

  const signup = (name: string, email: string, _password: string): boolean => {
    const username = name.toLowerCase().replace(/\s+/g, "").slice(0, 12);
    const newUser: User = {
      ...MOCK_USER,
      name,
      email,
      username,
      joinedDate: new Date().toISOString().split("T")[0],
      sellerLevel: 1,
      verified: false,
      following: 0,
      followers: 0,
      profileViews: 0,
      bio: "",
    };
    setUser(newUser);
    localStorage.setItem("vendfinder-user", JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("vendfinder-user");
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem("vendfinder-user", JSON.stringify(updated));
  };

  if (!loaded) return null;

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, signup, logout, updateProfile }}
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
