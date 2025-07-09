import { useWebSocketStore } from '@/stores/useWebSocketStore';
import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock WebSocket
class MockWebSocket implements WebSocket {
  static instances: MockWebSocket[] = [];

  // WebSocket properties
  binaryType: BinaryType = 'blob';
  readonly bufferedAmount = 0;
  readonly extensions = '';
  onclose: ((this: WebSocket, ev: CloseEvent) => void) | null = null;
  onerror: ((this: WebSocket, ev: Event) => void) | null = null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => void) | null = null;
  onopen: ((this: WebSocket, ev: Event) => void) | null = null;
  readonly protocol = '';
  readyState: number = WebSocket.CONNECTING;
  readonly url: string;

  // Mock-specific properties
  send = vi.fn(() => Promise.resolve()) as WebSocket['send'];

  close = vi.fn((code?: number, reason?: string) => {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      // Create a custom close event with the required properties
      const event = new Event('close') as unknown as CloseEvent & {
        code: number;
        reason: string;
        wasClean: boolean;
      };

      // Set the properties with defaults if not provided
      event.code = code ?? 1000; // 1000 = Normal Closure
      event.reason = reason ?? '';
      event.wasClean = true;

      this.onclose.call(this, event);
    }
  }) as WebSocket['close'];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  // Test helpers
  static clearInstances() {
    this.instances = [];
  }

  static get latest() {
    return this.instances[this.instances.length - 1];
  }

  // Simulate connection
  simulateOpen() {
    this.readyState = WebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open') as Event);
    }
  }

  // Simulate message
  simulateMessage(data: unknown) {
    if (this.onmessage) {
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify(data)
      });
      this.onmessage(messageEvent);
    }
  }

  // Simulate error
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  // Required WebSocket properties
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  // Required WebSocket methods
  addEventListener = vi.fn() as WebSocket['addEventListener'];
  removeEventListener = vi.fn() as WebSocket['removeEventListener'];

  dispatchEvent = vi.fn((): boolean => true) as WebSocket['dispatchEvent'];
}

// Extend global type for toast
declare global {
  var toast: {
    error: (
      message: string,
      options?: { description?: string; duration?: number }
    ) => void;
  };
}

// Mock global WebSocket and toast before tests
const setup = () => {
  global.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  global.toast = {
    error: vi.fn()
  };
};

// Clean up after tests
const cleanup = () => {
  MockWebSocket.clearInstances();
  vi.clearAllMocks();
};

// Setup and teardown
beforeEach(() => {
  // Clear instances before each test to ensure clean state
  MockWebSocket.clearInstances();
  setup();
});

afterEach(cleanup);

describe('useWebSocketStore', () => {
  beforeEach(() => {
    // Clear all instances before each test
    MockWebSocket.clearInstances();
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Clear all mocks and restore timers
    vi.clearAllMocks();
    vi.useRealTimers();
    // Reset the store state
    const { disconnect } = useWebSocketStore.getState();
    disconnect();
  });

  it('should initialize with default state', () => {
    const state = useWebSocketStore.getState();
    expect(state.isConnected).toBe(false);
    expect(state.ws).toBeNull();
    expect(state.shouldReconnect).toBe(true);
  });

  it('should connect to WebSocket', () => {
    const { connect } = useWebSocketStore.getState();

    act(() => {
      connect();
    });

    const ws = MockWebSocket.latest;
    expect(ws).toBeDefined();
  });

  it('should set connected state on open', () => {
    const { connect } = useWebSocketStore.getState();

    act(() => {
      connect();
    });

    const ws = MockWebSocket.latest;
    act(() => {
      ws.simulateOpen();
    });

    const { isConnected } = useWebSocketStore.getState();
    expect(isConnected).toBe(true);
  });

  it('should handle WebSocket messages', () => {
    const { connect } = useWebSocketStore.getState();
    const testMessage = { type: 'test', data: 'test' };

    // Override console.error to catch any parsing errors
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      connect();
    });

    const ws = MockWebSocket.latest;

    act(() => {
      ws.simulateOpen();
      ws.simulateMessage(testMessage);
    });

    // Verify no errors occurred during message handling
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should disconnect', () => {
    const { connect, disconnect } = useWebSocketStore.getState();

    act(() => {
      connect();
    });

    const ws = MockWebSocket.latest;
    const closeSpy = vi.spyOn(ws, 'close');

    act(() => {
      disconnect();
    });

    expect(closeSpy).toHaveBeenCalled();
    const { isConnected } = useWebSocketStore.getState();
    expect(isConnected).toBe(false);
  });

  it('should not reconnect when shouldReconnect is false', () => {
    const { connect, disconnect } = useWebSocketStore.getState();

    act(() => {
      connect();
    });

    const ws1 = MockWebSocket.latest;

    // Disable reconnection
    act(() => {
      disconnect();
    });

    act(() => {
      ws1.close();
    });

    // Fast forward past the reconnect delay
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Should not have created a new WebSocket instance
    expect(MockWebSocket.instances.length).toBe(1);
  });

  it('should send messages when connected', () => {
    const { connect, sendMessage } = useWebSocketStore.getState();
    const testMessage = 'test message';
    const expectedMessage = JSON.stringify(testMessage);

    act(() => {
      connect();
    });

    const ws = MockWebSocket.latest;
    const sendSpy = vi.spyOn(ws, 'send');

    act(() => {
      ws.simulateOpen();
      sendMessage(testMessage);
    });

    expect(sendSpy).toHaveBeenCalledWith(expectedMessage);
  });

  it('should not send messages when not connected', () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    const { sendMessage } = useWebSocketStore.getState();

    // Try to send a message when not connected
    sendMessage('test message');

    expect(consoleWarnSpy).toHaveBeenCalledWith('WebSocket is not connected');
    consoleWarnSpy.mockRestore();
  });
});
