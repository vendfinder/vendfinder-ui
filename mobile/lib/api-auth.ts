import { apiFetch } from "./api";

export interface AuthResponse {
  token?: string;
  user?: {
    id: string;
    email: string;
    username?: string;
    role?: string;
    displayName?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    bio?: string;
    location?: string;
    verified?: boolean;
    sellerLevel?: number;
    profileViews?: number;
    followingCount?: number;
    followersCount?: number;
    socialInstagram?: string;
    socialTwitter?: string;
    socialWebsite?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  error?: string;
  code?: string;
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username: name, email, password, tosAccepted: true }),
  });
}

export async function oauthLogin(
  provider: "google" | "apple",
  token: string,
  name?: string
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/oauth", {
    method: "POST",
    body: JSON.stringify({ provider, token, name }),
  });
}
