/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';

// Mock fetch
global.fetch = jest.fn();

// Import the API route
import { POST } from '@/app/api/uploads/product-videos/route';

describe('/api/uploads/product-videos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_BASE_URL = 'http://test-api:3000';
  });

  test('proxies video upload to API gateway', async () => {
    const mockFile = new Blob(['video content'], { type: 'video/mp4' });
    const formData = new FormData();
    formData.append('video', mockFile);

    const request = new NextRequest('http://localhost:3000/api/uploads/product-videos', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' },
      body: formData
    });

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        videoUrl: 'https://storage.test/video.mp4',
        metadata: { duration: 120, size: 25000000, format: 'mp4' }
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(fetch).toHaveBeenCalledWith(
      'http://test-api:3000/api/uploads/product-videos',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      })
    );
    expect(data.success).toBe(true);
    expect(data.videoUrl).toBe('https://storage.test/video.mp4');
  });

  test('handles upload errors gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/uploads/product-videos', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' }
    });

    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBe('Failed to upload video');
  });
});