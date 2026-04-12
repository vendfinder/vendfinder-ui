import type { Story, UserStoryGroup } from '@/types';

export async function fetchStoryFeed(token: string): Promise<UserStoryGroup[]> {
  try {
    const res = await fetch('/api/stories', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.groups || [];
  } catch {
    return [];
  }
}

export async function fetchUserStories(
  userId: string,
  token?: string
): Promise<Story[]> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/stories/user/${userId}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.stories || [];
  } catch {
    return [];
  }
}

export async function createStory(
  payload: {
    mediaUrl: string;
    mediaType?: 'image';
    textOverlay?: string;
    textPosition?: 'top' | 'center' | 'bottom';
  },
  token: string
): Promise<Story | null> {
  try {
    const res = await fetch('/api/stories', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function deleteStory(
  storyId: string,
  token: string
): Promise<boolean> {
  try {
    const res = await fetch(`/api/stories/${storyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function markStoryViewed(
  storyId: string,
  token: string
): Promise<void> {
  try {
    await fetch(`/api/stories/${storyId}/view`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // silent
  }
}

export async function uploadStoryMedia(
  file: File,
  token: string
): Promise<{ url?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('media', file);

    const res = await fetch('/api/uploads/story-media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || 'Upload failed' };
    return { url: data.mediaUrl };
  } catch {
    return { error: 'Failed to upload story media' };
  }
}
