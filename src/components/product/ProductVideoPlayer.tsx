'use client';

import { useState } from 'react';
import { VideoItem } from '@/types';

interface ProductVideoPlayerProps {
  video: VideoItem;
  className?: string;
}

export default function ProductVideoPlayer({
  video,
  className = ''
}: ProductVideoPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleLoadedData = () => {
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div className={`aspect-video bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <div className="text-muted-foreground text-sm">Video unavailable</div>
          {video.thumbnail && (
            <img
              src={video.thumbnail}
              alt="Video thumbnail"
              className="mt-2 max-h-16 mx-auto rounded opacity-50"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <video
        src={video.url}
        poster={video.thumbnail}
        controls
        preload="none"
        className="w-full h-auto rounded-lg bg-black"
        onError={handleError}
        onLoadStart={handleLoadStart}
        onLoadedData={handleLoadedData}
        role="video"
      >
        Your browser does not support the video tag.
      </video>

      {isLoading && (
        <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}