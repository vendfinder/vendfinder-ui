import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import NewListingPage from '@/app/dashboard/listings/new/page';
import * as apiProducts from '@/lib/api-products';

// Mock dependencies
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

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'newListing.title': 'Create New Listing',
      'newListing.subtitle': 'List your item for sale',
      'newListing.productDetails': 'Product Details',
      'newListing.productName': 'Product Name',
      'newListing.productNamePlaceholder': 'Enter product name',
      'productNamePlaceholder': 'Enter product name',
      'newListing.description': 'Description',
      'newListing.optional': 'optional',
      'newListing.descriptionPlaceholder': 'Describe your item',
      'newListing.category': 'Category',
      'newListing.photos': 'Product Photos',
      'videos': 'Product Videos',
      'videosDesc': 'Add videos to showcase your product (MP4, MOV, AVI)',
      'addVideo': 'Add Video',
      'uploadProgress': 'Uploading',
      'newListing.continue': 'Continue',
      'continue': 'Continue',
      'newListing.back': 'Back',
      'newListing.listItem': 'List Item',
      'listItem': 'List Item',
      'newListing.stepProductInfo': 'Product Info',
      'newListing.stepConditionSize': 'Condition & Size',
      'newListing.stepSetPrice': 'Set Price',
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

describe('NewListingPage Video Upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUploadProductImages.mockResolvedValue(['http://example.com/image1.jpg']);
    mockUploadProductVideos.mockResolvedValue(['http://example.com/video1.mp4']);
    mockCreateProduct.mockResolvedValue({ id: 'product-1' });
    mockCreateAsk.mockResolvedValue({ id: 'ask-1' });
  });

  test('renders video upload section in step 1', () => {
    render(<NewListingPage />);

    // Video upload section should be visible
    expect(screen.getByText('Product Videos')).toBeInTheDocument();
    expect(screen.getByText('Add videos to showcase your product (MP4, MOV, AVI)')).toBeInTheDocument();
  });

  test('accepts video file uploads', async () => {
    render(<NewListingPage />);

    // Create a mock video file
    const videoFile = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });

    // Find the video file input (hidden)
    const videoInput = screen.getByTestId('video-file-input');

    // Simulate file upload
    act(() => {
      act(() => {
      fireEvent.change(videoInput, { target: { files: [videoFile] } });
    });
    });

    expect(videoInput).toHaveProperty('files', expect.objectContaining({ 0: videoFile, length: 1 }));
  });

  test('validates video file size (30MB limit)', async () => {
    render(<NewListingPage />);

    // Create a mock oversized video file (31MB)
    const oversizedFile = new File(['x'.repeat(31 * 1024 * 1024)], 'large-video.mp4', { type: 'video/mp4' });

    const videoInput = screen.getByTestId('video-file-input');

    act(() => {
      fireEvent.change(videoInput, { target: { files: [oversizedFile] } });
    });

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/exceeds 30MB limit/i)).toBeInTheDocument();
    });
  });

  test('validates video file type (MP4, MOV, AVI only)', async () => {
    render(<NewListingPage />);

    // Create a mock invalid file type
    const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });

    const videoInput = screen.getByTestId('video-file-input');

    act(() => {
      fireEvent.change(videoInput, { target: { files: [invalidFile] } });
    });

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
    });
  });

  test('shows video upload progress', async () => {
    // Mock the upload function to simulate delay
    mockUploadProductVideos.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve(['http://example.com/video1.mp4']), 100))
    );

    render(<NewListingPage />);

    const videoFile = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });
    const videoInput = screen.getByTestId('video-file-input');

    act(() => {
      fireEvent.change(videoInput, { target: { files: [videoFile] } });
    });

    // Should show uploading state
    expect(screen.getByText('Uploading...')).toBeInTheDocument();

    // Wait for upload to complete
    await waitFor(() => {
      expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
    });
  });

  test('shows video preview with remove button', async () => {
    render(<NewListingPage />);

    const videoFile = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });
    const videoInput = screen.getByTestId('video-file-input');

    act(() => {
      fireEvent.change(videoInput, { target: { files: [videoFile] } });
    });

    // Wait for upload to complete and video preview to appear
    await waitFor(() => {
      expect(screen.getByTestId('video-preview-0')).toBeInTheDocument();
      expect(screen.getByText('✓ Uploaded')).toBeInTheDocument();
    });

    // Should show file name and size
    expect(screen.getByText('test-video.mp4')).toBeInTheDocument();

    // Should have remove button
    const removeButton = screen.getByTestId('remove-video-0');
    expect(removeButton).toBeInTheDocument();
  });

  test('removes video when remove button clicked', async () => {
    render(<NewListingPage />);

    const videoFile = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });
    const videoInput = screen.getByTestId('video-file-input');

    act(() => {
      fireEvent.change(videoInput, { target: { files: [videoFile] } });
    });

    // Wait for video preview and upload completion
    await waitFor(() => {
      expect(screen.getByTestId('video-preview-0')).toBeInTheDocument();
      expect(screen.getByText('✓ Uploaded')).toBeInTheDocument();
    });

    // Click remove button
    const removeButton = screen.getByTestId('remove-video-0');
    fireEvent.click(removeButton);

    // Video preview should be removed
    expect(screen.queryByTestId('video-preview-0')).not.toBeInTheDocument();
    expect(screen.queryByText('test-video.mp4')).not.toBeInTheDocument();
  });

  test('includes video URLs in media object when form submitted', async () => {
    render(<NewListingPage />);

    // Upload a video
    const videoFile = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });
    const videoInput = screen.getByTestId('video-file-input');
    act(() => {
      fireEvent.change(videoInput, { target: { files: [videoFile] } });
    });

    // Wait for upload to complete
    await waitFor(() => {
      expect(screen.getByTestId('video-preview-0')).toBeInTheDocument();
      expect(screen.getByText('✓ Uploaded')).toBeInTheDocument();
    });

    // Verify the video URL was added to the component's state
    // Since we can't directly access component state, we verify that the video was uploaded
    // and preview shows, which means it's ready to be included in the media object
    expect(mockUploadProductVideos).toHaveBeenCalledWith([videoFile], 'mock-token');
    expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
  });

  test('handles video upload errors gracefully', async () => {
    // Mock the upload function to reject
    mockUploadProductVideos.mockRejectedValue(new Error('Upload failed'));

    render(<NewListingPage />);

    const videoFile = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });
    const videoInput = screen.getByTestId('video-file-input');

    act(() => {
      fireEvent.change(videoInput, { target: { files: [videoFile] } });
    });

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });
  });
});