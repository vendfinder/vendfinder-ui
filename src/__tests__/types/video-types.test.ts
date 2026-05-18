import { Media, Product } from '@/types';

describe('Video Type Support', () => {
  test('Media interface supports videos array', () => {
    const media: Media = {
      images: [{ url: 'test.jpg', alt: 'test', sort_order: 1 }],
      videos: [{
        url: 'test.mp4',
        thumbnail: 'thumb.jpg',
        duration: 120,
        size: 25000000,
        sort_order: 1
      }]
    };
    expect(media.videos).toBeDefined();
    expect(media.videos?.[0]?.url).toBe('test.mp4');
  });

  test('Product interface includes video metadata', () => {
    const product: Product = {
      id: 'test',
      vendor_id: 'vendor1',
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test description',
      longDescription: 'Test long description',
      price: 99,
      retail_price: 100,
      images: [],
      category: 'hair',
      tags: [],
      rating: 4.5,
      reviewCount: 10,
      inStock: true,
      sku: 'TEST-001',
      features: [],
      specifications: {},
      createdAt: new Date().toISOString(),
      media: {
        images: [],
        videos: [{
          url: 'product.mp4',
          thumbnail: 'thumb.jpg',
          duration: 90,
          size: 20000000,
          sort_order: 1
        }]
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    expect(product.media?.videos).toBeDefined();
  });
});