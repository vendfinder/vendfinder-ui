'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Trash2, Pause, Send } from 'lucide-react';
import type { Story, UserStoryGroup } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useStoryStore } from '@/stores/stories';
import { createConversation, sendMessage } from '@/lib/api-chat';

const STORY_DURATION = 5000; // 5 seconds per story

function timeAgo(
  dateStr: string,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return t('justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('hoursAgo', { count: hours });
  return t('daysAgo', { count: Math.floor(hours / 24) });
}

export default function StoryViewer() {
  const t = useTranslations('stories');
  const { user, token } = useAuth();
  const {
    feed,
    viewerOpen,
    viewerGroupIndex,
    viewerStoryIndex,
    closeViewer,
    setViewerIndex,
    markViewed,
    deleteStory,
  } = useStoryStore();

  const [mounted, setMounted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const replyInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const elapsedRef = useRef(0);

  useEffect(() => setMounted(true), []);

  const group: UserStoryGroup | undefined = feed[viewerGroupIndex];
  const story: Story | undefined = group?.stories[viewerStoryIndex];
  const isOwnStory = user?.id === group?.userId;

  // Mark viewed on display
  useEffect(() => {
    if (viewerOpen && story && !story.viewed && token) {
      markViewed(story.id, token);
    }
  }, [viewerOpen, story?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll
  useEffect(() => {
    if (!viewerOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewerOpen]);

  // Auto-advance timer
  const goNext = useCallback(() => {
    if (!group) return;
    // Next story in same group
    if (viewerStoryIndex < group.stories.length - 1) {
      setViewerIndex(viewerGroupIndex, viewerStoryIndex + 1);
      setProgress(0);
      elapsedRef.current = 0;
    }
    // Next group
    else if (viewerGroupIndex < feed.length - 1) {
      setViewerIndex(viewerGroupIndex + 1, 0);
      setProgress(0);
      elapsedRef.current = 0;
    }
    // End
    else {
      closeViewer();
    }
  }, [
    group,
    viewerStoryIndex,
    viewerGroupIndex,
    feed.length,
    setViewerIndex,
    closeViewer,
  ]);

  const goBack = useCallback(() => {
    if (viewerStoryIndex > 0) {
      setViewerIndex(viewerGroupIndex, viewerStoryIndex - 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else if (viewerGroupIndex > 0) {
      const prevGroup = feed[viewerGroupIndex - 1];
      setViewerIndex(viewerGroupIndex - 1, prevGroup.stories.length - 1);
      setProgress(0);
      elapsedRef.current = 0;
    }
  }, [viewerStoryIndex, viewerGroupIndex, feed, setViewerIndex]);

  // Timer logic
  useEffect(() => {
    if (!viewerOpen || paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const total = elapsedRef.current + (now - startTimeRef.current);
      const pct = Math.min(total / STORY_DURATION, 1);
      setProgress(pct);
      if (pct >= 1) {
        elapsedRef.current = 0;
        goNext();
      }
    }, 30);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      elapsedRef.current += Date.now() - startTimeRef.current;
    };
  }, [viewerOpen, paused, viewerGroupIndex, viewerStoryIndex, goNext]);

  // Reset progress on story change
  useEffect(() => {
    setProgress(0);
    elapsedRef.current = 0;
    setPaused(false);
  }, [viewerGroupIndex, viewerStoryIndex]);

  // Keyboard nav
  useEffect(() => {
    if (!viewerOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeViewer();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goBack();
      if (e.key === ' ') {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [viewerOpen, goNext, goBack, closeViewer]);

  const handleDelete = async () => {
    if (!story || !token || deleting) return;
    setDeleting(true);
    await deleteStory(story.id, token);
    setDeleting(false);
    goNext();
  };

  const handleReply = async () => {
    if (!replyText.trim() || !token || !group || replySending) return;
    setReplySending(true);
    try {
      const { id: convId } = await createConversation(
        null,
        group.userId,
        token
      );
      await sendMessage(
        convId,
        `Replied to your story: "${replyText.trim()}"`,
        token
      );
      setReplyText('');
      setReplySent(true);
      setTimeout(() => setReplySent(false), 2000);
    } catch {
      // silently fail
    }
    setReplySending(false);
  };

  // Reset reply state on story change
  useEffect(() => {
    setReplyText('');
    setReplySent(false);
  }, [viewerGroupIndex, viewerStoryIndex]);

  if (!mounted || !viewerOpen || !group || !story) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="story-viewer-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      >
        {/* Cinematic container — capped at phone-like aspect on desktop */}
        <div className="relative w-full h-full max-w-[420px] max-h-[90vh] mx-auto flex flex-col">
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-[3px] px-3 pt-3">
            {group.stories.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-[3px] rounded-full bg-white/20 overflow-hidden"
              >
                <div
                  className="h-full bg-white rounded-full transition-[width] ease-linear"
                  style={{
                    width:
                      i < viewerStoryIndex
                        ? '100%'
                        : i === viewerStoryIndex
                          ? `${progress * 100}%`
                          : '0%',
                    transitionDuration: i === viewerStoryIndex ? '30ms' : '0ms',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header overlay */}
          <div className="absolute top-5 left-0 right-0 z-20 px-4 pt-3 flex items-center gap-3">
            {/* User avatar */}
            <div className="w-9 h-9 rounded-full bg-white/10 border-2 border-white/20 overflow-hidden shrink-0">
              {group.avatarUrl ? (
                <img
                  src={group.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                  {group.displayName?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {group.displayName}
              </p>
              <p className="text-white/50 text-[11px]">
                {timeAgo(story.createdAt, t)}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              {paused && (
                <div className="px-2 py-1 rounded-lg bg-white/10 text-white/60 text-[10px] font-semibold flex items-center gap-1">
                  <Pause size={10} /> {t('paused')}
                </div>
              )}
              {isOwnStory && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={closeViewer}
                className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Story content */}
          <div className="relative flex-1 overflow-hidden rounded-2xl bg-black">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${viewerGroupIndex}-${viewerStoryIndex}`}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <img
                  src={story.mediaUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {/* Cinematic vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_50%,rgba(0,0,0,0.4)_100%)]" />
                {/* Top gradient for readability */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
                {/* Bottom gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />
              </motion.div>
            </AnimatePresence>

            {/* Text overlay */}
            {story.textOverlay && (
              <div
                className={`absolute left-0 right-0 z-10 px-6 text-center ${
                  story.textPosition === 'top'
                    ? 'top-24'
                    : story.textPosition === 'bottom'
                      ? 'bottom-20'
                      : 'top-1/2 -translate-y-1/2'
                }`}
              >
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="inline-block bg-black/50 backdrop-blur-md text-white text-lg font-bold px-5 py-3 rounded-2xl border border-white/10 shadow-2xl"
                >
                  {story.textOverlay}
                </motion.p>
              </div>
            )}

            {/* Tap zones */}
            <div className="absolute inset-0 z-10 flex">
              <div
                className="w-1/3 h-full"
                onClick={goBack}
                onPointerDown={() => setPaused(true)}
                onPointerUp={() => setPaused(false)}
              />
              <div
                className="w-1/3 h-full"
                onClick={() => setPaused((p) => !p)}
                onPointerDown={() => setPaused(true)}
                onPointerUp={() => setPaused(false)}
              />
              <div
                className="w-1/3 h-full"
                onClick={goNext}
                onPointerDown={() => setPaused(true)}
                onPointerUp={() => setPaused(false)}
              />
            </div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-0 right-0 z-20 px-4"
          >
            {isOwnStory ? (
              /* View count for own stories */
              <div className="flex justify-center">
                <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md text-white/70 text-sm border border-white/10">
                  <Eye size={14} />
                  <span className="font-medium">{story.viewCount}</span>
                  <span className="text-white/40">
                    {t('viewCount', { count: story.viewCount })}
                  </span>
                </div>
              </div>
            ) : (
              /* Reply input for others' stories */
              <div className="relative">
                {replySent ? (
                  <div className="flex justify-center">
                    <div className="px-4 py-2.5 rounded-full bg-primary/20 backdrop-blur-md text-primary text-sm font-medium border border-primary/30">
                      {t('replySent')}
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleReply();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      ref={replyInputRef}
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onFocus={() => setPaused(true)}
                      onBlur={() => {
                        if (!replyText.trim()) setPaused(false);
                      }}
                      placeholder={t('replyPlaceholder', {
                        name: group.displayName,
                      })}
                      className="flex-1 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-md text-white text-sm placeholder:text-white/40 border border-white/15 focus:border-white/30 focus:outline-none transition-colors"
                    />
                    {replyText.trim() && (
                      <button
                        type="submit"
                        disabled={replySending}
                        className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0 hover:bg-primary-dark transition-colors disabled:opacity-50"
                      >
                        <Send size={16} />
                      </button>
                    )}
                  </form>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
