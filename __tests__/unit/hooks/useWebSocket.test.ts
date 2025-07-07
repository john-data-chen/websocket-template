import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WebSocketMessage } from '../../../src/constants/websocket';
import { useWebSocket } from '../../../src/hooks/useWebSocket';

type MockWebSocket = {
  onmessage: ((event: MessageEvent) => void) | null;
  onopen: (() => void) | null;
  onclose: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  readyState: number;
  close: ReturnType<typeof vi.fn> & (() => void);
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
      } else if (
        (event === 'open' || event === 'close') &&
        mockWebSocket[`on${event}`]
      ) {
        mockWebSocket[`on${event}`]?.();
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
  const mockOnError = vi.fn();

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

  it('應該創建 WebSocket 連接並設置事件處理器', () => {
    renderHook(() => useWebSocket(TEST_URL));

    expect(global.WebSocket).toHaveBeenCalledWith(TEST_URL);

    expect(mockWebSocket.onmessage).toBeDefined();
    expect(mockWebSocket.onopen).toBeDefined();
    expect(mockWebSocket.onclose).toBeDefined();
    expect(mockWebSocket.onerror).toBeDefined();
  });

  it('應該在組件卸載時關閉 WebSocket 連接', () => {
    const { unmount } = renderHook(() => useWebSocket(TEST_URL));

    act(() => {
      mockWebSocket._triggerEvent('open');
    });

    unmount();

    expect(mockWebSocket.close).toHaveBeenCalled();

    act(() => {
      mockWebSocket._triggerEvent('close');
    });
  });

  it('應該處理接收消息', () => {
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

    act(() => {
      mockWebSocket._triggerEvent('message', testMessage);
    });

    expect(mockOnMessage).toHaveBeenCalledWith(testMessage);
    expect(mockOnMessage).toHaveBeenCalledWith(testMessage);
  });

  it('應該處理 WebSocket 打開事件', () => {
    renderHook(() =>
      useWebSocket(TEST_URL, {
        onOpen: mockOnOpen
      })
    );

    act(() => {
      mockWebSocket._triggerEvent('open');
    });

    expect(mockOnOpen).toHaveBeenCalled();
    expect(mockOnOpen).toHaveBeenCalled();
  });

  it('應該處理 WebSocket 關閉事件', () => {
    renderHook(() =>
      useWebSocket(TEST_URL, {
        onClose: mockOnClose
      })
    );

    act(() => {
      mockWebSocket._triggerEvent('close');
    });

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('應該處理 WebSocket 錯誤事件', () => {
    renderHook(() =>
      useWebSocket(TEST_URL, {
        onError: mockOnError
      })
    );

    act(() => {
      mockWebSocket._triggerError();
    });

    expect(mockOnError).toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalled();
  });

  it('應該在連接關閉後嘗試重新連接', async () => {
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
