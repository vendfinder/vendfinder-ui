import { render, screen } from '@testing-library/react';
import ProductCard from '@/components/product/ProductCard';

// Mock dependencies
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('next/image', () => {
  const MockImage = ({
    src,
    alt,
    className,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fill,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sizes,
    ...props
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
    sizes?: string;
    [key: string]: unknown;
  }) => {
    const imgProps: Record<string, unknown> = { src, alt, ...props };
    if (className) imgProps.className = className;
    // Don't pass fill and sizes attributes to DOM img element
    return <img {...imgProps} alt={alt || ''} />;
  };
  MockImage.displayName = 'MockImage';
  return MockImage;
});

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: { percent?: number; name?: string }) => {
    if (key === 'product.quickView') return 'Quick View';
    if (key === 'product.percentOff') return `${values?.percent}% off`;
    if (key === 'product.lowStock') return 'Low Stock';
    if (key === 'product.addToCartAriaLabel') return `Add ${values?.name} to cart`;
    return key;
  },
}));

jest.mock('@/hooks/useFormattedPrice', () => ({
  useFormattedPrice: () => (price: number) => `$${price}`,
}));

jest.mock('@/context/CartContext', () => ({
  useCart: () => ({
    addItem: jest.fn(),
  }),
}));

jest.mock('@/components/ui/Rating', () => {
  const MockRating = ({ value, count }: { value: number; count: number }) => (
    <div data-testid="rating">{value}/5 ({count} reviews)</div>
  );
  MockRating.displayName = 'MockRating';
  return MockRating;
});

jest.mock('@/hooks/useTranslatedProduct', () => ({
  useTranslatedProduct: (product: unknown) => product,
}));

describe('ProductCard Video Features', () => {
  const baseProduct = {
    id: '1',
    slug: 'test-product',
    name: 'Test Product',
    description: 'Test description',
    longDescription: 'Test long description',
    price: 100,
    retail_price: 100,
    images: ['test.jpg'],
    category: 'hair',
    tags: [],
    rating: 4.5,
    reviewCount: 10,
    inStock: true,
    sku: 'TEST-001',
    features: [],
    specifications: {},
    createdAt: '2024-01-01',
  };

  test('shows video badge when product has videos', () => {
    const productWithVideo = {
      ...baseProduct,
      media: {
        videos: [{
          url: 'test.mp4',
          thumbnail: 'thumb.jpg',
          duration: 120,
          size: 25000000,
          sort_order: 1
        }]
      }
    };

    render(<ProductCard product={productWithVideo} />);

    expect(screen.getByLabelText('Has video')).toBeInTheDocument();
  });

  test('does not show video badge when no videos', () => {
    const productWithoutVideo = {
      ...baseProduct,
      media: { images: [{ url: 'test.jpg', alt: 'test', sort_order: 1 }] }
    };

    render(<ProductCard product={productWithoutVideo} />);

    expect(screen.queryByLabelText('Has video')).not.toBeInTheDocument();
  });

  test('does not show video badge when media is undefined', () => {
    const productWithoutMedia = baseProduct;

    render(<ProductCard product={productWithoutMedia} />);

    expect(screen.queryByLabelText('Has video')).not.toBeInTheDocument();
  });

  test('shows video count in badge when multiple videos', () => {
    const productWithMultipleVideos = {
      ...baseProduct,
      media: {
        videos: [
          { url: 'test1.mp4', thumbnail: 'thumb1.jpg', duration: 120, size: 25000000, sort_order: 1 },
          { url: 'test2.mp4', thumbnail: 'thumb2.jpg', duration: 90, size: 20000000, sort_order: 2 }
        ]
      }
    };

    render(<ProductCard product={productWithMultipleVideos} />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('does not show count for single video', () => {
    const productWithSingleVideo = {
      ...baseProduct,
      media: {
        videos: [{
          url: 'test.mp4',
          thumbnail: 'thumb.jpg',
          duration: 120,
          size: 25000000,
          sort_order: 1
        }]
      }
    };

    render(<ProductCard product={productWithSingleVideo} />);

    // Should have the video badge but no count number
    expect(screen.getByLabelText('Has video')).toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });
});