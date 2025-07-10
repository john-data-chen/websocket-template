import { useWebSocket } from '@/hooks/useWebSocket';
import type { WebSocketMessage } from '@/types/websocket';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type MockWebSocket = {
  onmessage: ((event: MessageEvent) => void) | null;
  onopen: (() => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  readyState: number;
  close: () => void;
  send: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;

  _triggerEvent: {
    (event: 'message', data: WebSocketMessage): void;
    (event: 'open' | 'close'): void;
  };
  _triggerError: () => void;
};

const createMockWebSocket = (): MockWebSocket => {
  const mockWebSocket: MockWebSocket = {
    onmessage: null,
    onopen: null,
    onclose: null,
    onerror: null,
    readyState: WebSocket.OPEN,
    close: vi.fn(),
    send: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    _triggerEvent: (
      event: 'message' | 'open' | 'close',
      data?: WebSocketMessage
    ) => {
      if (event === 'message' && data) {
        const messageEvent = new MessageEvent('message', {
          data: JSON.stringify(data)
        });
        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage(messageEvent);
        }
      } else if (event === 'close' && mockWebSocket.onclose) {
        const closeEvent = {
          type: 'close',
          wasClean: true,
          code: 1000,
          reason: 'Normal closure',
          target: mockWebSocket
        } as unknown as CloseEvent;
        mockWebSocket.onclose(closeEvent);
      } else if (event === 'open' && mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }
    },
    _triggerError: () => {
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(new Event('error'));
      }
    }
  };

  return mockWebSocket;
};

global.WebSocket = vi.fn(createMockWebSocket) as unknown as typeof WebSocket;

describe('useWebSocket', () => {
  let mockWebSocket: ReturnType<typeof createMockWebSocket>;

  const mockOnMessage = vi.fn();
  const mockOnOpen = vi.fn();
  const mockOnClose = vi.fn();

  const TEST_URL = 'ws://test-websocket';

  beforeEach(() => {
    vi.clearAllMocks();

    mockWebSocket = createMockWebSocket();

    (
      global.WebSocket as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(() => mockWebSocket as unknown as WebSocket);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create WebSocket connection and set up event handlers', () => {
    renderHook(() => useWebSocket(TEST_URL));

    expect(global.WebSocket).toHaveBeenCalledWith(TEST_URL);

    expect(mockWebSocket.onmessage).toBeDefined();
    expect(mockWebSocket.onopen).toBeDefined();
    expect(mockWebSocket.onclose).toBeDefined();
    expect(mockWebSocket.onerror).toBeDefined();
  });

  it('should handle received messages', () => {
    const testMessage: WebSocketMessage = {
      type: 'message',
      message: {
        id: '1',
        content: 'test message',
        timestamp: new Date().toISOString(),
        userId: 'user-1'
      }
    };

    renderHook(() =>
      useWebSocket(TEST_URL, {
        onMessage: mockOnMessage
      })
    );

    // Simulate WebSocket connection established
    act(() => {
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }
    });

    // Trigger message event
    act(() => {
      const messageEvent = {
        data: JSON.stringify(testMessage)
      } as MessageEvent;

      // Directly trigger the onmessage handler
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(messageEvent);
      }
    });

    // Verify that onMessage callback was called correctly
    expect(mockOnMessage).toHaveBeenCalledTimes(1);
    expect(mockOnMessage).toHaveBeenCalledWith(testMessage);
  });

  it('should handle WebSocket open event', () => {
    renderHook(() =>
      useWebSocket(TEST_URL, {
        onOpen: mockOnOpen
      })
    );

    act(() => {
      mockWebSocket._triggerEvent('open');
    });

    expect(mockOnOpen).toHaveBeenCalled();
  });

  it('should handle WebSocket close event', () => {
    renderHook(() =>
      useWebSocket(TEST_URL, {
        onClose: mockOnClose
      })
    );

    act(() => {
      mockWebSocket._triggerEvent('close');
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should wait for connection to be established before sending messages', async () => {
    vi.useFakeTimers();

    const { unmount } = renderHook(() =>
      useWebSocket(TEST_URL, {
        onClose: mockOnClose
      })
    );

    act(() => {
      mockWebSocket._triggerEvent('open');
    });

    (global.WebSocket as unknown as { mockClear: () => void }).mockClear();

    act(() => {
      mockWebSocket.readyState = WebSocket.CLOSED;
      mockWebSocket._triggerEvent('close');
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(global.WebSocket).toHaveBeenCalledTimes(1);

    unmount();
    vi.useRealTimers();
  });
});
