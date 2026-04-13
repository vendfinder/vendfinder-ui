import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastContainer, ToastMessage } from '../Toast';

describe('Toast', () => {
  it('renders toast message correctly', () => {
    const mockToasts: ToastMessage[] = [
      {
        id: '1',
        type: 'success',
        title: 'Success',
        description: 'Operation completed successfully',
        duration: 5000,
      },
    ];

    const mockOnClose = jest.fn();

    render(<ToastContainer toasts={mockToasts} onClose={mockOnClose} />);

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const mockToasts: ToastMessage[] = [
      {
        id: '1',
        type: 'error',
        title: 'Error',
        description: 'Something went wrong',
      },
    ];

    const mockOnClose = jest.fn();

    render(<ToastContainer toasts={mockToasts} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledWith('1');
  });

  it('auto-closes toast after duration', async () => {
    jest.useFakeTimers();

    const mockToasts: ToastMessage[] = [
      {
        id: '1',
        type: 'info',
        title: 'Info',
        duration: 1000,
      },
    ];

    const mockOnClose = jest.fn();

    render(<ToastContainer toasts={mockToasts} onClose={mockOnClose} />);

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockOnClose).toHaveBeenCalledWith('1');

    jest.useRealTimers();
  });
});