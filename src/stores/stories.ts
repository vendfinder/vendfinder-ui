'use client';

import { create } from 'zustand';
import type { Story, UserStoryGroup } from '@/types';
import * as api from '@/lib/api-stories';

interface StoryStore {
  // State
  feed: UserStoryGroup[];
  feedLoaded: boolean;
  userStories: Record<string, Story[]>;

  // Viewer state
  viewerOpen: boolean;
  viewerGroupIndex: number;
  viewerStoryIndex: number;

  // Creator state
  creatorOpen: boolean;

  // Actions
  fetchFeed: (token: string) => Promise<void>;
  fetchUserStories: (userId: string, token?: string) => Promise<void>;
  createStory: (
    payload: {
      mediaUrl: string;
      textOverlay?: string;
      textPosition?: 'top' | 'center' | 'bottom';
    },
    token: string
  ) => Promise<boolean>;
  deleteStory: (storyId: string, token: string) => Promise<boolean>;
  markViewed: (storyId: string, token: string) => void;

  // Viewer
  openViewer: (groupIndex: number, storyIndex?: number) => void;
  closeViewer: () => void;
  setViewerIndex: (groupIndex: number, storyIndex: number) => void;

  // Creator
  openCreator: () => void;
  closeCreator: () => void;
}

export const useStoryStore = create<StoryStore>((set, get) => ({
  feed: [],
  feedLoaded: false,
  userStories: {},
  viewerOpen: false,
  viewerGroupIndex: 0,
  viewerStoryIndex: 0,
  creatorOpen: false,

  fetchFeed: async (token) => {
    try {
      const feed = await api.fetchStoryFeed(token);
      set({ feed, feedLoaded: true });
    } catch {
      set({ feedLoaded: true });
    }
  },

  fetchUserStories: async (userId, token) => {
    try {
      const stories = await api.fetchUserStories(userId, token);
      set((state) => ({
        userStories: { ...state.userStories, [userId]: stories },
      }));
    } catch {
      // silent
    }
  },

  createStory: async (payload, token) => {
    const story = await api.createStory(payload, token);
    if (story) {
      // Refresh feed to include new story
      await get().fetchFeed(token);
      return true;
    }
    return false;
  },

  deleteStory: async (storyId, token) => {
    const ok = await api.deleteStory(storyId, token);
    if (ok) {
      // Remove from local state
      set((state) => ({
        feed: state.feed
          .map((g) => ({
            ...g,
            stories: g.stories.filter((s) => s.id !== storyId),
          }))
          .filter((g) => g.stories.length > 0),
      }));
    }
    return ok;
  },

  markViewed: (storyId, token) => {
    api.markStoryViewed(storyId, token);
    set((state) => ({
      feed: state.feed.map((g) => {
        const updated = g.stories.map((s) =>
          s.id === storyId ? { ...s, viewed: true } : s
        );
        return {
          ...g,
          stories: updated,
          hasUnviewed: updated.some((s) => !s.viewed),
        };
      }),
    }));
  },

  openViewer: (groupIndex, storyIndex = 0) =>
    set({
      viewerOpen: true,
      viewerGroupIndex: groupIndex,
      viewerStoryIndex: storyIndex,
    }),

  closeViewer: () => set({ viewerOpen: false }),

  setViewerIndex: (groupIndex, storyIndex) =>
    set({ viewerGroupIndex: groupIndex, viewerStoryIndex: storyIndex }),

  openCreator: () => set({ creatorOpen: true }),
  closeCreator: () => set({ creatorOpen: false }),
}));
