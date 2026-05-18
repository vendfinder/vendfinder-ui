import { uploadProductVideos } from '@/lib/api-products';

// Mock fetch
global.fetch = jest.fn();

describe('uploadProductVideos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uploads single video file successfully', async () => {
    const mockFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
    const token = 'test-token';

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        videoUrl: 'https://storage.test/test.mp4',
        metadata: { duration: 120, size: 25000000, format: 'mp4' }
      })
    });

    const result = await uploadProductVideos([mockFile], token);

    expect(fetch).toHaveBeenCalledWith('/api/uploads/product-videos', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' },
      body: expect.any(FormData)
    });
    expect(result).toEqual(['https://storage.test/test.mp4']);
  });

  test('validates file size limit', async () => {
    const largeFile = new File(['x'.repeat(31 * 1024 * 1024)], 'large.mp4', { type: 'video/mp4' });
    const token = 'test-token';

    await expect(uploadProductVideos([largeFile], token)).rejects.toThrow('File large.mp4 exceeds 30MB limit');
  });

  test('validates file type', async () => {
    const wrongFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    const token = 'test-token';

    await expect(uploadProductVideos([wrongFile], token)).rejects.toThrow('Invalid file type');
  });
});