/**
 * @jest-environment jsdom
 */

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      typeMessage: 'Type a message...',
      enterOfferAmount: 'Enter offer amount',
      makeOffer: 'Make Offer',
    };
    return translations[key] || key;
  },
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MessageInput from '../MessageInput';

describe('MessageInput Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows error message and retry button on send failure', async () => {
    const mockOnSend = jest.fn().mockRejectedValue(new Error('Send failed'));

    render(<MessageInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Test message' } });

    const sendButton = screen.getByRole('button');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to send message')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    expect(mockOnSend).toHaveBeenCalledWith('Test message');
  });

  it('retries sending message when retry button is clicked', async () => {
    const mockOnSend = jest.fn()
      .mockRejectedValueOnce(new Error('Send failed'))
      .mockResolvedValueOnce(undefined);

    render(<MessageInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Test message' } });

    const sendButton = screen.getByRole('button');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledTimes(2);
    });
  });

  it('shows loading spinner when sending message', async () => {
    const mockOnSend = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<MessageInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Test message' } });

    const sendButton = screen.getByRole('button');
    fireEvent.click(sendButton);

    // Should show loading state
    await waitFor(() => {
      expect(sendButton).toBeDisabled();
    });

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('Test message');
    });
  });
});