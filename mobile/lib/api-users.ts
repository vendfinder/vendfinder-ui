import { apiFetch } from "./api";

export interface ApiUser {
  id: string;
  email?: string;
  username: string;
  role: string;
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
}

export interface ProfileUpdateData {
  username?: string;
  email?: string;
  displayName?: string;
  bio?: string;
  location?: string;
  socialInstagram?: string;
  socialTwitter?: string;
  socialWebsite?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}

export async function fetchUserByUsername(
  username: string
): Promise<{ user?: ApiUser; error?: string }> {
  try {
    const user = await apiFetch<ApiUser>(`/users/by-username/${encodeURIComponent(username)}`);
    return { user };
  } catch {
    return { error: "User not found" };
  }
}

export async function updateUserProfile(
  id: string,
  data: ProfileUpdateData,
  token: string
): Promise<{ user?: ApiUser; error?: string }> {
  try {
    const result = await apiFetch<{ user: ApiUser }>(`/users/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(data),
    });
    return { user: result.user };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update profile" };
  }
}

export async function uploadUserAvatar(
  uri: string,
  token: string
): Promise<{ url?: string; error?: string }> {
  try {
    const formData = new FormData();
    const filename = uri.split("/").pop() || "avatar.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append("avatar", {
      uri,
      name: filename,
      type,
    } as unknown as Blob);

    const res = await fetch(
      `${__DEV__ ? "http://localhost:3000" : "https://vendfinder.com"}/api/uploads/user-avatar`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
    );
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Upload failed" };
    return { url: data.avatarUrl };
  } catch {
    return { error: "Failed to upload image" };
  }
}
