'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StoryRingProps {
  children: ReactNode;
  hasStories: boolean;
  hasUnviewed: boolean;
  onClick?: () => void;
  /** Ring shape: "square" for rounded-2xl avatars, "circle" for round avatars */
  shape?: 'square' | 'circle';
  /** Gap width in px between ring and avatar */
  gap?: number;
  /** Ring width in px */
  ringWidth?: number;
}

export default function StoryRing({
  children,
  hasStories,
  hasUnviewed,
  onClick,
  shape = 'square',
  gap = 3,
  ringWidth = 3,
}: StoryRingProps) {
  if (!hasStories) {
    return <>{children}</>;
  }

  const outerRadius = shape === 'square' ? 'rounded-[20px]' : 'rounded-full';
  const innerRadius = shape === 'square' ? 'rounded-[17px]' : 'rounded-full';

  return (
    <>
      {/* Keyframes injected once */}
      <style jsx global>{`
        @property --ring-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes story-ring-rotate {
          to {
            --ring-angle: 360deg;
          }
        }
        .story-ring-gradient {
          background: conic-gradient(
            from var(--ring-angle),
            #e8883a 0%,
            #f59e0b 25%,
            #ef4444 50%,
            #f59e0b 75%,
            #e8883a 100%
          );
          animation: story-ring-rotate 4s linear infinite;
        }
      `}</style>
      <button
        type="button"
        onClick={onClick}
        className={`relative block cursor-pointer group ${onClick ? '' : 'pointer-events-none'}`}
      >
        {/* Outer glow (unviewed only) */}
        {hasUnviewed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute inset-0 ${outerRadius}`}
            style={{
              margin: `-${ringWidth + gap + 1}px`,
              background:
                'conic-gradient(from 0deg, #e8883a, #f59e0b, #ef4444, #f59e0b, #e8883a)',
              filter: 'blur(6px)',
            }}
          />
        )}

        {/* Ring */}
        <div
          className={`${outerRadius} ${hasUnviewed ? 'story-ring-gradient' : ''}`}
          style={{
            padding: `${ringWidth}px`,
            margin: `-${ringWidth + gap}px`,
            ...(hasUnviewed ? {} : { background: 'rgba(255,255,255,0.15)' }),
          }}
        >
          {/* Inner gap (background color) */}
          <div
            className={`${innerRadius} bg-background`}
            style={{ padding: `${gap}px` }}
          >
            {children}
          </div>
        </div>
      </button>
    </>
  );
}
