import { render, screen, fireEvent } from '@testing-library/react';
import ProductVideoPlayer from '@/components/product/ProductVideoPlayer';

describe('ProductVideoPlayer', () => {
  const mockVideo = {
    url: 'https://storage.test/video.mp4',
    thumbnail: 'https://storage.test/thumb.jpg',
    duration: 120,
    size: 25000000,
    sort_order: 1
  };

  test('renders video player with controls', () => {
    render(<ProductVideoPlayer video={mockVideo} />);

    const video = screen.getByRole('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('controls');
    expect(video).toHaveAttribute('preload', 'none');
  });

  test('displays thumbnail when video not playing', () => {
    render(<ProductVideoPlayer video={mockVideo} />);

    const video = screen.getByRole('video');
    expect(video).toHaveAttribute('poster', 'https://storage.test/thumb.jpg');
  });

  test('shows fallback when video fails to load', () => {
    const videoWithoutThumbnail = { ...mockVideo, thumbnail: undefined };
    render(<ProductVideoPlayer video={videoWithoutThumbnail} />);

    const video = screen.getByRole('video');
    fireEvent.error(video);

    expect(screen.getByText('Video unavailable')).toBeInTheDocument();
  });

  test('applies mobile-friendly styles', () => {
    render(<ProductVideoPlayer video={mockVideo} />);

    const video = screen.getByRole('video');
    expect(video).toHaveClass('w-full', 'rounded-lg');
  });
});