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
    tosAccepted?: boolean;
    subscriptionStatus?: string;
  };
  error?: string;
  code?: string;
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: name, email, password, tosAccepted: true }),
  });
  return res.json();
}

export async function oauthLogin(
  provider: "google" | "apple",
  token: string,
  name?: string
): Promise<AuthResponse> {
  const res = await fetch("/api/auth/oauth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, token, name }),
  });
  return res.json();
}
