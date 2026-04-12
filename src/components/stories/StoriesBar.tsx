'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStoryStore } from '@/stores/stories';
import StoryViewer from './StoryViewer';
import StoryCreator from './StoryCreator';

/* Animated ring keyframes — injected once */
const RING_STYLES = `
@property --story-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}
@keyframes story-ring-spin {
  to { --story-angle: 360deg; }
}
`;

export default function StoriesBar() {
  const t = useTranslations('stories');
  const { user, token, isAuthenticated } = useAuth();
  const { feed, feedLoaded, fetchFeed, openViewer, openCreator } =
    useStoryStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token && !feedLoaded) {
      fetchFeed(token);
    }
  }, [token, feedLoaded, fetchFeed]);

  const ownGroupIndex = feed.findIndex((g) => g.userId === user?.id);
  const hasOwnStory = ownGroupIndex >= 0;

  if (!isAuthenticated) return null;

  return (
    <>
      <style jsx global>
        {RING_STYLES}
      </style>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Section header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-1 h-5 rounded-full bg-primary" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            {t('title')}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
        </div>

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex items-start gap-4 overflow-x-auto pb-1 scrollbar-hide"
        >
          {/* "Your Story" — always first */}
          {!hasOwnStory ? (
            <AddStoryButton
              avatar={user?.avatar}
              onClick={openCreator}
              yourStoryLabel={t('yourStory')}
            />
          ) : (
            <StoryCircle
              group={feed[ownGroupIndex]}
              onClick={() => openViewer(ownGroupIndex)}
              isOwn
              onAddClick={openCreator}
              yourStoryLabel={t('yourStory')}
            />
          )}

          {/* Other users' stories */}
          {feed.map((group, i) => {
            if (group.userId === user?.id) return null;
            return (
              <StoryCircle
                key={group.userId}
                group={group}
                onClick={() => openViewer(i)}
              />
            );
          })}
        </div>
      </motion.div>

      <StoryViewer />
      <StoryCreator />
    </>
  );
}

/* ─── Add Story Button ─── */
function AddStoryButton({
  avatar,
  onClick,
  yourStoryLabel,
}: {
  avatar?: string;
  onClick: () => void;
  yourStoryLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
    >
      <div className="relative">
        {/* Solid circle — flush gradient border, no gap */}
        <div
          className="w-16 h-16 rounded-full p-[2.5px] group-hover:brightness-125 transition-all duration-300"
          style={{
            background:
              'linear-gradient(135deg, rgba(232,136,58,0.5), rgba(245,158,11,0.2), rgba(232,136,58,0.5))',
          }}
        >
          <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
            {avatar ? (
              <img
                src={avatar}
                alt=""
                className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-300"
              />
            ) : (
              <Plus
                size={22}
                className="text-primary/60 group-hover:text-primary transition-colors duration-300"
                strokeWidth={1.5}
              />
            )}
          </div>
        </div>
        {/* Plus badge */}
        <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background shadow-lg shadow-primary/30 z-10 group-hover:scale-110 transition-transform duration-200">
          <Plus size={12} className="text-white" strokeWidth={3} />
        </div>
      </div>
      <span className="text-[11px] text-muted/70 font-medium w-16 text-center truncate group-hover:text-foreground transition-colors duration-200">
        {yourStoryLabel}
      </span>
    </button>
  );
}

/* ─── Story Circle ─── */
function StoryCircle({
  group,
  onClick,
  isOwn,
  onAddClick,
  yourStoryLabel,
}: {
  group: {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    hasUnviewed: boolean;
    stories: unknown[];
  };
  onClick: () => void;
  isOwn?: boolean;
  onAddClick?: () => void;
  yourStoryLabel?: string;
}) {
  const unviewed = group.hasUnviewed;

  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="relative">
        <button
          type="button"
          onClick={onClick}
          className="block cursor-pointer group"
        >
          {/* Solid circle — flush border, no gap */}
          <div
            className="w-16 h-16 rounded-full p-[2.5px]"
            style={{
              background: unviewed
                ? 'conic-gradient(from var(--story-angle), #e8883a 0%, #f59e0b 25%, #ef4444 50%, #f59e0b 75%, #e8883a 100%)'
                : 'rgba(255,255,255,0.18)',
              animation: unviewed
                ? 'story-ring-spin 4s linear infinite'
                : 'none',
            }}
          >
            <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
              {group.avatarUrl ? (
                <img
                  src={group.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-foreground text-lg font-bold">
                  {group.displayName?.charAt(0) || '?'}
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Own story: + badge */}
        {isOwn && onAddClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddClick();
            }}
            className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background shadow-lg shadow-primary/30 z-10 cursor-pointer hover:scale-110 transition-transform duration-200"
          >
            <Plus size={12} className="text-white" strokeWidth={3} />
          </button>
        )}
      </div>
      <span className="text-[11px] text-muted/70 font-medium w-16 text-center truncate">
        {isOwn ? yourStoryLabel : group.displayName}
      </span>
    </div>
  );
}
