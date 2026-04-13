import { renderHook, waitFor } from '@testing-library/react';
import { useSocket } from '../useSocket';
import * as socketIOClient from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');
jest.mock('@/stores/chat', () => ({
  useChatStore: jest.fn(() => ({
    setConnected: jest.fn(),
    onNewMessage: jest.fn(),
    onTypingStart: jest.fn(),
    onTypingStop: jest.fn(),
    onPresenceUpdate: jest.fn(),
    onReadUpdate: jest.fn(),
    onMessageTranslated: jest.fn(),
    onOfferUpdate: jest.fn(),
    onUnreadUpdate: jest.fn(),
  })),
}));

jest.mock('@/lib/notification-sound', () => ({
  playNotificationChime: jest.fn(),
}));

describe('useSocket', () => {
  let mockSocket: any;
  let mockIO: jest.MockedFunction<typeof socketIOClient.io>;
  let eventHandlers: Record<string, jest.Mock>;

  beforeEach(() => {
    eventHandlers = {};

    mockSocket = {
      on: jest.fn((event: string, handler: any) => {
        eventHandlers[event] = jest.fn(handler);
      }),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connected: false,
    };

    mockIO = socketIOClient.io as jest.MockedFunction<typeof socketIOClient.io>;
    mockIO.mockReturnValue(mockSocket as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not create a socket when token is null', () => {
    renderHook(() => useSocket(null));

    expect(mockIO).not.toHaveBeenCalled();
  });

  it('should create a socket connection with a token', () => {
    renderHook(() => useSocket('test-token'));

    expect(mockIO).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        auth: { token: 'test-token' },
        transports: ['websocket', 'polling'],
        reconnection: true,
      })
    );
  });

  it('should disconnect when token changes from valid to null', () => {
    const { rerender } = renderHook(
      ({ token }) => useSocket(token),
      { initialProps: { token: 'test-token' } }
    );

    expect(mockIO).toHaveBeenCalled();

    rerender({ token: null });

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('should reconnect with new token when token changes', () => {
    const { rerender } = renderHook(
      ({ token }) => useSocket(token),
      { initialProps: { token: 'old-token' } }
    );

    const firstCallCount = mockIO.mock.calls.length;

    mockSocket.connected = false; // Simulate disconnection

    rerender({ token: 'new-token' });

    expect(mockIO).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        auth: { token: 'new-token' },
      })
    );
    expect(mockIO.mock.calls.length).toBeGreaterThan(firstCallCount);
  });

  it('should not reconnect if already connected', () => {
    const { rerender } = renderHook(
      ({ token }) => useSocket(token),
      { initialProps: { token: 'test-token' } }
    );

    mockSocket.connected = true;
    const callCount = mockIO.mock.calls.length;

    rerender({ token: 'test-token' });

    // Should not create a new connection
    expect(mockIO.mock.calls.length).toBe(callCount);
  });

  it('should handle connect_error event for auth failures', () => {
    renderHook(() => useSocket('invalid-token'));

    const connectErrorHandler = eventHandlers['connect_error'];
    expect(connectErrorHandler).toBeDefined();

    connectErrorHandler({
      data: { content: 'Authentication error' },
    });

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('should register message event handlers', () => {
    renderHook(() => useSocket('test-token'));

    expect(eventHandlers['message:new']).toBeDefined();
    expect(eventHandlers['typing:start']).toBeDefined();
    expect(eventHandlers['typing:stop']).toBeDefined();
    expect(eventHandlers['presence:update']).toBeDefined();
    expect(eventHandlers['read:update']).toBeDefined();
    expect(eventHandlers['message:translated']).toBeDefined();
    expect(eventHandlers['offer:update']).toBeDefined();
    expect(eventHandlers['unread:update']).toBeDefined();
    expect(eventHandlers['order:shipped']).toBeDefined();
  });

  it('should return conversation control methods', () => {
    const { result } = renderHook(() => useSocket('test-token'));

    expect(result.current).toHaveProperty('joinConversation');
    expect(result.current).toHaveProperty('leaveConversation');
    expect(result.current).toHaveProperty('emitTypingStart');
    expect(result.current).toHaveProperty('emitTypingStop');
    expect(result.current).toHaveProperty('emitMessageRead');

    expect(typeof result.current.joinConversation).toBe('function');
    expect(typeof result.current.leaveConversation).toBe('function');
    expect(typeof result.current.emitTypingStart).toBe('function');
    expect(typeof result.current.emitTypingStop).toBe('function');
    expect(typeof result.current.emitMessageRead).toBe('function');
  });

  it('should emit conversation events through socket', () => {
    const { result } = renderHook(() => useSocket('test-token'));

    result.current.joinConversation('conv-123');
    expect(mockSocket.emit).toHaveBeenCalledWith('conversation:join', 'conv-123');

    result.current.leaveConversation('conv-123');
    expect(mockSocket.emit).toHaveBeenCalledWith('conversation:leave', 'conv-123');

    result.current.emitTypingStart('conv-123');
    expect(mockSocket.emit).toHaveBeenCalledWith('typing:start', 'conv-123');

    result.current.emitTypingStop('conv-123');
    expect(mockSocket.emit).toHaveBeenCalledWith('typing:stop', 'conv-123');

    result.current.emitMessageRead('conv-123');
    expect(mockSocket.emit).toHaveBeenCalledWith('message:read', { conversationId: 'conv-123' });
  });

  it('should clean up socket on unmount', () => {
    const { unmount } = renderHook(() => useSocket('test-token'));

    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
