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

export async function uploadUserImage(
  type: 'avatar' | 'banner',
  file: File,
  token: string
): Promise<{ url?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append(type === 'avatar' ? 'avatar' : 'banner', file);

    const res = await fetch(`/api/uploads/user-${type}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || 'Upload failed' };
    }
    return { url: type === 'avatar' ? data.avatarUrl : data.bannerUrl };
  } catch {
    return { error: 'Failed to upload image' };
  }
}

export async function fetchUserByUsername(
  username: string
): Promise<{ user?: ApiUser; error?: string }> {
  try {
    const res = await fetch(
      `/api/users/by-username/${encodeURIComponent(username)}`
    );
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || 'User not found' };
    }
    return { user: data };
  } catch {
    return { error: 'Failed to connect to server' };
  }
}

export async function updateUserProfile(
  id: string,
  data: ProfileUpdateData,
  token: string
): Promise<{ user?: ApiUser; error?: string }> {
  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      return { error: result.error || 'Failed to update profile' };
    }
    return { user: result.user };
  } catch {
    return { error: 'Failed to connect to server' };
  }
}
