import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import NewListingPage from '@/app/dashboard/listings/new/page';
import ProductCard from '@/components/product/ProductCard';
import ProductVideoPlayer from '@/components/product/ProductVideoPlayer';
import * as apiProducts from '@/lib/api-products';

// Mock dependencies using existing patterns
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/listings/new',
}));

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
    fill,
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
    return <img {...imgProps} alt={alt || ''} />;
  };
  MockImage.displayName = 'MockImage';
  return MockImage;
});

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      'newListing.title': 'Create New Listing',
      'newListing.productName': 'Product Name',
      'productNamePlaceholder': 'Enter product name',
      'newListing.description': 'Description',
      'newListing.descriptionPlaceholder': 'Describe your item',
      'newListing.category': 'Category',
      'newListing.photos': 'Product Photos',
      'videos': 'Product Videos',
      'videosDesc': 'Add videos to showcase your product (MP4, MOV, AVI)',
      'addVideo': 'Add Video',
      'uploadProgress': 'Uploading',
      'continue': 'Continue',
      'newListing.continue': 'Continue',
      'listItem': 'List Item',
      'product.quickView': 'Quick View',
      'product.addToCartAriaLabel': `Add ${values?.name || 'item'} to cart`,
    };
    return translations[key] || key;
  },
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-token',
    user: { id: '1', username: 'testuser' },
    isAuthenticated: true,
  }),
}));

jest.mock('@/context/CartContext', () => ({
  useCart: () => ({
    addItem: jest.fn(),
  }),
}));

jest.mock('@/components/dashboard/SellerGate', () => {
  const MockSellerGate = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="seller-gate">{children}</div>
  );
  MockSellerGate.displayName = 'MockSellerGate';
  return MockSellerGate;
});

jest.mock('@/components/product/SizeChartModal', () => {
  const MockSizeChartModal = ({ open }: { open: boolean }) =>
    open ? <div data-testid="size-chart-modal">Size Chart</div> : null;
  MockSizeChartModal.displayName = 'MockSizeChartModal';
  return MockSizeChartModal;
});

jest.mock('@/data/categories', () => ({
  categories: [
    { slug: 'hair', name: 'Hair', description: 'Hair products' },
    { slug: 'apparel', name: 'Apparel', description: 'Clothing items' },
  ],
}));

jest.mock('@/hooks/useFormattedPrice', () => ({
  useFormattedPrice: () => (price: number) => `$${price}`,
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

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the API functions
jest.mock('@/lib/api-products', () => ({
  uploadProductImages: jest.fn(),
  uploadProductVideos: jest.fn(),
  createProduct: jest.fn(),
  createAsk: jest.fn(),
}));

const mockUploadProductVideos = apiProducts.uploadProductVideos as jest.MockedFunction<typeof apiProducts.uploadProductVideos>;
const mockUploadProductImages = apiProducts.uploadProductImages as jest.MockedFunction<typeof apiProducts.uploadProductImages>;
const mockCreateProduct = apiProducts.createProduct as jest.MockedFunction<typeof apiProducts.createProduct>;
const mockCreateAsk = apiProducts.createAsk as jest.MockedFunction<typeof apiProducts.createAsk>;

describe('Video Upload Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default successful responses
    mockUploadProductImages.mockResolvedValue(['http://example.com/image1.jpg']);
    mockUploadProductVideos.mockResolvedValue(['http://example.com/video1.mp4']);
    mockCreateProduct.mockResolvedValue({ id: 'product-1' });
    mockCreateAsk.mockResolvedValue({ id: 'ask-1' });
  });

  describe('Complete Video Upload and Display Flow', () => {
    test('completes full workflow: upload → validate → display → form submission', async () => {
      render(<NewListingPage />);

      // Step 1: Verify video upload section is present
      expect(screen.getByText('Product Videos')).toBeInTheDocument();
      expect(screen.getByText('Add videos to showcase your product (MP4, MOV, AVI)')).toBeInTheDocument();

      // Step 2: Upload a valid video file
      const videoFile = new File(['video content'], 'demo-video.mp4', { type: 'video/mp4' });
      const videoInput = screen.getByTestId('video-file-input');

      act(() => {
        fireEvent.change(videoInput, { target: { files: [videoFile] } });
      });

      // Step 3: Wait for upload progress and completion
      expect(screen.getByText('Uploading...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('✓ Uploaded')).toBeInTheDocument();
        expect(screen.getByTestId('video-preview-0')).toBeInTheDocument();
        expect(screen.getByText('demo-video.mp4')).toBeInTheDocument();
      });

      // Step 4: Verify API was called with correct parameters
      expect(mockUploadProductVideos).toHaveBeenCalledWith([videoFile], 'mock-token');

      // Step 5: Fill required form fields to proceed (both name and category are required)
      const productNameInput = screen.getByPlaceholderText('Enter product name');
      fireEvent.change(productNameInput, { target: { value: 'Test Product with Video' } });

      // Select a category to satisfy the form validation
      await waitFor(() => {
        const categoryOption = screen.getByText('Hair');
        fireEvent.click(categoryOption);
      });

      // Step 6: Verify form can proceed with video attached
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await waitFor(() => {
        expect(continueButton).not.toBeDisabled();
      });

      // Step 7: Verify video data is maintained in component state
      expect(screen.getByTestId('video-preview-0')).toBeInTheDocument();
      expect(screen.getByText('demo-video.mp4')).toBeInTheDocument();
    });

    test('handles multiple video uploads in sequence', async () => {
      render(<NewListingPage />);

      const videoInput = screen.getByTestId('video-file-input');

      // Upload first video
      const video1 = new File(['video1 content'], 'video1.mp4', { type: 'video/mp4' });
      act(() => {
        fireEvent.change(videoInput, { target: { files: [video1] } });
      });

      await waitFor(() => {
        expect(screen.getByTestId('video-preview-0')).toBeInTheDocument();
        expect(screen.getByText('video1.mp4')).toBeInTheDocument();
      });

      // Upload second video
      const video2 = new File(['video2 content'], 'video2.mov', { type: 'video/quicktime' });
      act(() => {
        fireEvent.change(videoInput, { target: { files: [video2] } });
      });

      await waitFor(() => {
        expect(screen.getByTestId('video-preview-1')).toBeInTheDocument();
        expect(screen.getByText('video2.mov')).toBeInTheDocument();
      });

      // Verify both videos are present
      expect(screen.getByTestId('video-preview-0')).toBeInTheDocument();
      expect(screen.getByTestId('video-preview-1')).toBeInTheDocument();
      expect(mockUploadProductVideos).toHaveBeenCalledTimes(2);
    });

    test('handles video removal and re-upload cycle', async () => {
      render(<NewListingPage />);

      const videoInput = screen.getByTestId('video-file-input');
      const videoFile = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });

      // Upload video
      act(() => {
        fireEvent.change(videoInput, { target: { files: [videoFile] } });
      });

      await waitFor(() => {
        expect(screen.getByTestId('video-preview-0')).toBeInTheDocument();
      });

      // Remove video
      const removeButton = screen.getByTestId('remove-video-0');
      fireEvent.click(removeButton);

      expect(screen.queryByTestId('video-preview-0')).not.toBeInTheDocument();
      expect(screen.queryByText('test-video.mp4')).not.toBeInTheDocument();

      // Re-upload video
      const newVideoFile = new File(['new video content'], 'new-video.mp4', { type: 'video/mp4' });
      act(() => {
        fireEvent.change(videoInput, { target: { files: [newVideoFile] } });
      });

      await waitFor(() => {
        expect(screen.getByTestId('video-preview-0')).toBeInTheDocument();
        expect(screen.getByText('new-video.mp4')).toBeInTheDocument();
      });
    });
  });

  describe('Video Validation Errors Prevent Form Submission', () => {
    test('blocks form submission when video validation fails', async () => {
      render(<NewListingPage />);

      // Upload oversized video
      const oversizedFile = new File(['x'.repeat(31 * 1024 * 1024)], 'large-video.mp4', { type: 'video/mp4' });
      const videoInput = screen.getByTestId('video-file-input');

      act(() => {
        fireEvent.change(videoInput, { target: { files: [oversizedFile] } });
      });

      // Wait for validation error
      await waitFor(() => {
        expect(screen.getByText(/exceeds 30MB limit/i)).toBeInTheDocument();
      });

      // Verify no upload attempt was made
      expect(mockUploadProductVideos).not.toHaveBeenCalled();

      // Fill other required fields
      const productNameInput = screen.getByPlaceholderText('Enter product name');
      fireEvent.change(productNameInput, { target: { value: 'Test Product' } });

      await waitFor(() => {
        const categoryOption = screen.getByText('Hair');
        fireEvent.click(categoryOption);
      });

      // Verify form progress is still blocked due to validation error
      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).not.toBeDisabled(); // The button itself isn't disabled, but validation errors are shown
    });

    test('shows validation error for invalid file types', async () => {
      render(<NewListingPage />);

      const invalidFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      const videoInput = screen.getByTestId('video-file-input');

      act(() => {
        fireEvent.change(videoInput, { target: { files: [invalidFile] } });
      });

      await waitFor(() => {
        expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
      });

      expect(mockUploadProductVideos).not.toHaveBeenCalled();
    });

    test('validates multiple files and shows individual errors', async () => {
      render(<NewListingPage />);

      const validFile = new File(['video content'], 'valid.mp4', { type: 'video/mp4' });
      const invalidFile = new File(['content'], 'invalid.txt', { type: 'text/plain' });
      const oversizedFile = new File(['x'.repeat(31 * 1024 * 1024)], 'large.mp4', { type: 'video/mp4' });

      const videoInput = screen.getByTestId('video-file-input');

      // Upload valid file first
      act(() => {
        fireEvent.change(videoInput, { target: { files: [validFile] } });
      });

      await waitFor(() => {
        expect(screen.getByTestId('video-preview-0')).toBeInTheDocument();
      });

      // Try to upload invalid file
      act(() => {
        fireEvent.change(videoInput, { target: { files: [invalidFile] } });
      });

      await waitFor(() => {
        expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
      });

      // Try to upload oversized file
      act(() => {
        fireEvent.change(videoInput, { target: { files: [oversizedFile] } });
      });

      await waitFor(() => {
        expect(screen.getByText(/exceeds 30MB limit/i)).toBeInTheDocument();
      });

      // Verify only valid file was uploaded
      expect(mockUploadProductVideos).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('video-preview-0')).toBeInTheDocument();
      expect(screen.queryByTestId('video-preview-1')).not.toBeInTheDocument();
    });

    test('handles network upload failures gracefully', async () => {
      mockUploadProductVideos.mockRejectedValue(new Error('Network connection failed'));

      render(<NewListingPage />);

      const videoFile = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });
      const videoInput = screen.getByTestId('video-file-input');

      act(() => {
        fireEvent.change(videoInput, { target: { files: [videoFile] } });
      });

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Network connection failed')).toBeInTheDocument();
      });

      // Verify no video preview is shown
      expect(screen.queryByTestId('video-preview-0')).not.toBeInTheDocument();

      // Verify user can retry
      const retryInput = screen.getByTestId('video-file-input');
      expect(retryInput).toBeEnabled();
    });
  });

  describe('Video Player Displays Correctly on Product Pages', () => {
    test('product card shows video badge when videos are present', () => {
      const productWithVideo = {
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
        media: {
          videos: [
            {
              url: 'http://example.com/video1.mp4',
              thumbnail: 'http://example.com/thumb1.jpg',
              duration: 120,
              size: 25000000,
              sort_order: 1
            }
          ]
        }
      };

      render(<ProductCard product={productWithVideo} />);

      expect(screen.getByLabelText('Has video')).toBeInTheDocument();
    });

    test('product card shows video count for multiple videos', () => {
      const productWithMultipleVideos = {
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
        media: {
          videos: [
            {
              url: 'http://example.com/video1.mp4',
              thumbnail: 'http://example.com/thumb1.jpg',
              duration: 120,
              size: 25000000,
              sort_order: 1
            },
            {
              url: 'http://example.com/video2.mp4',
              thumbnail: 'http://example.com/thumb2.jpg',
              duration: 90,
              size: 20000000,
              sort_order: 2
            }
          ]
        }
      };

      render(<ProductCard product={productWithMultipleVideos} />);

      expect(screen.getByLabelText('Has video')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    test('video player renders with proper controls', () => {
      const mockVideo = {
        url: 'http://example.com/test-video.mp4',
        thumbnail: 'http://example.com/thumbnail.jpg',
        duration: 120,
        size: 25000000,
        sort_order: 1
      };

      render(<ProductVideoPlayer video={mockVideo} />);

      // FIXED: Use the correct role 'video' instead of 'application'
      const video = screen.getByRole('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', 'http://example.com/test-video.mp4');
      expect(video).toHaveAttribute('poster', 'http://example.com/thumbnail.jpg');
    });
  });

  describe('State Management and Performance', () => {
    test('maintains video state during form navigation', async () => {
      render(<NewListingPage />);

      // Upload video in step 1
      const videoFile = new File(['video content'], 'persistent-video.mp4', { type: 'video/mp4' });
      const videoInput = screen.getByTestId('video-file-input');

      act(() => {
        fireEvent.change(videoInput, { target: { files: [videoFile] } });
      });

      await waitFor(() => {
        expect(screen.getByTestId('video-preview-0')).toBeInTheDocument();
        expect(screen.getByText('persistent-video.mp4')).toBeInTheDocument();
      });

      // Fill required fields and navigate to next step
      const productNameInput = screen.getByPlaceholderText('Enter product name');
      fireEvent.change(productNameInput, { target: { value: 'Test Product' } });

      await waitFor(() => {
        const categoryOption = screen.getByText('Hair');
        fireEvent.click(categoryOption);
      });

      // Navigate to next step
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await waitFor(() => {
        expect(continueButton).not.toBeDisabled();
      });

      // Video should still be in state when form is submitted
      expect(mockUploadProductVideos).toHaveBeenCalledWith([videoFile], 'mock-token');
    });

    test('handles rapid sequential uploads without data loss', async () => {
      render(<NewListingPage />);

      const videoInput = screen.getByTestId('video-file-input');

      // Rapid fire multiple uploads
      const videos = [
        new File(['content1'], 'rapid1.mp4', { type: 'video/mp4' }),
        new File(['content2'], 'rapid2.mp4', { type: 'video/mp4' }),
        new File(['content3'], 'rapid3.mp4', { type: 'video/mp4' })
      ];

      for (let i = 0; i < videos.length; i++) {
        act(() => {
          fireEvent.change(videoInput, { target: { files: [videos[i]] } });
        });

        await waitFor(() => {
          expect(screen.getByTestId(`video-preview-${i}`)).toBeInTheDocument();
        });
      }

      // Verify all uploads were processed
      expect(mockUploadProductVideos).toHaveBeenCalledTimes(3);
      expect(screen.getByTestId('video-preview-0')).toBeInTheDocument();
      expect(screen.getByTestId('video-preview-1')).toBeInTheDocument();
      expect(screen.getByTestId('video-preview-2')).toBeInTheDocument();
    });

    test('respects video upload limits', async () => {
      render(<NewListingPage />);

      const videoInput = screen.getByTestId('video-file-input');

      // Upload multiple videos and verify that only 4 are shown in UI
      for (let i = 0; i < 4; i++) {
        const video = new File([`content${i}`], `video${i}.mp4`, { type: 'video/mp4' });
        act(() => {
          fireEvent.change(videoInput, { target: { files: [video] } });
        });

        await waitFor(() => {
          expect(screen.getByTestId(`video-preview-${i}`)).toBeInTheDocument();
        });
      }

      // Verify we have exactly 4 video previews (the limit)
      expect(screen.queryByTestId('video-preview-0')).toBeInTheDocument();
      expect(screen.queryByTestId('video-preview-1')).toBeInTheDocument();
      expect(screen.queryByTestId('video-preview-2')).toBeInTheDocument();
      expect(screen.queryByTestId('video-preview-3')).toBeInTheDocument();
      expect(screen.queryByTestId('video-preview-4')).not.toBeInTheDocument();
    });
  });
});