import { useWebSocketEditing } from '@/hooks/useWebSocketEditing';
import { act, renderHook } from '@testing-library/react';
import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi
} from 'vitest';

// Define WebSocket message type for type safety
interface WebSocketMessage {
  type: string;
  payload: {
    recordId: string | number;
    users?: string[];
    userName?: string;
  };
}

// Mock the WebSocket store
const mockSendMessage = vi.fn();
let messageHandler: ((message: WebSocketMessage) => void) | null = null;

vi.mock('@/stores/useWebSocketStore', () => {
  const actual = vi.importActual('@/stores/useWebSocketStore');
  return {
    ...actual,
    useWebSocketMessage: vi.fn(
      (handler: (message: WebSocketMessage) => void) => {
        messageHandler = handler;
        return vi.fn(); // cleanup function
      }
    ),
    useWebSocketActions: () => ({
      sendMessage: mockSendMessage
    })
  };
});

// Mock the toast hook
const mockShowToast = vi.fn();
const mockHideToast = vi.fn();

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
    hideToast: mockHideToast
  })
}));

// Mock the document object for toast element
const mockQuerySelector = vi.spyOn(document, 'querySelector') as MockInstance;
const mockToastElement = document.createElement('div');
mockToastElement.style.display = 'none';
mockQuerySelector.mockReturnValue(mockToastElement);

// Setup the mocks
beforeEach(() => {
  vi.clearAllMocks();

  // Reset the mock implementation
  mockSendMessage.mockClear();
  mockShowToast.mockClear();
  mockHideToast.mockClear();
  messageHandler = null;

  // Setup the WebSocket message handler
  messageHandler = null;
});

describe('useWebSocketEditing', () => {
  const mockOnEditingUsersChange = vi.fn();

  const defaultProps = {
    recordId: '123',
    currentUserName: 'testUser',
    onEditingUsersChange: mockOnEditingUsersChange
  };

  afterAll(() => {
    mockQuerySelector.mockRestore();
    vi.clearAllMocks();
  });

  it('should initialize with empty editing users', () => {
    const { result } = renderHook(() => useWebSocketEditing(defaultProps));

    expect(result.current.editingUsers).toEqual([]);
  });

  it('should send start_editing message on mount', () => {
    const { result } = renderHook(() => useWebSocketEditing(defaultProps));

    expect(mockSendMessage).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'start_editing',
        payload: {
          recordId: 123, // Should be a number, not a string
          userName: 'testUser'
        }
      })
    );

    expect(result.current).toBeDefined();
  });

  it('should send stop_editing message on unmount', () => {
    const { unmount } = renderHook(() => useWebSocketEditing(defaultProps));

    // Clear the initial call to sendMessage
    mockSendMessage.mockClear();

    unmount();

    expect(mockSendMessage).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'stop_editing',
        payload: {
          recordId: 123, // Should be a number, not a string
          userName: 'testUser'
        }
      })
    );
  });

  it('should update editing users and show toast on editing_status_update', () => {
    const { result } = renderHook(() => useWebSocketEditing(defaultProps));

    // Verify message handler was set
    const handler = messageHandler;
    if (!handler) {
      throw new Error('Message handler not set');
    }

    act(() => {
      handler({
        type: 'editing_status_update',
        payload: {
          recordId: '123',
          users: ['otherUser1', 'otherUser2', 'testUser']
        }
      });
    });

    // Should filter out the current user
    expect(result.current.editingUsers).toEqual(['otherUser1', 'otherUser2']);
    expect(mockOnEditingUsersChange).toHaveBeenCalledWith([
      'otherUser1',
      'otherUser2'
    ]);
    expect(mockShowToast).toHaveBeenCalled();
  });

  it('should hide toast when no other users are editing', () => {
    const { result } = renderHook(() => useWebSocketEditing(defaultProps));

    // Verify message handler was set
    const handler = messageHandler;
    if (!handler) {
      throw new Error('Message handler not set');
    }

    // First, simulate users editing
    act(() => {
      handler({
        type: 'editing_status_update',
        payload: {
          recordId: '123',
          users: ['testUser', 'otherUser']
        }
      });
    });

    // Then simulate no other users editing
    act(() => {
      handler({
        type: 'editing_status_update',
        payload: {
          recordId: '123',
          users: ['testUser']
        }
      });
    });

    expect(result.current.editingUsers).toEqual([]);
    expect(mockOnEditingUsersChange).toHaveBeenCalledWith([]);
    expect(mockHideToast).toHaveBeenCalled();
  });

  it('should handle clearEditingNotification', () => {
    const { result } = renderHook(() => useWebSocketEditing(defaultProps));

    // Set some initial state
    act(() => {
      result.current.clearEditingNotification();
    });

    expect(result.current.editingUsers).toEqual([]);
  });

  it('should handle hideToast', () => {
    const { result } = renderHook(() => useWebSocketEditing(defaultProps));

    // First show the toast
    mockToastElement.style.display = 'block';

    act(() => {
      result.current.hideToast();
    });

    expect(mockHideToast).toHaveBeenCalled();
  });

  it('should process messages for any recordId', () => {
    const { result } = renderHook(() => useWebSocketEditing(defaultProps));

    // Verify message handler was set
    const handler = messageHandler;
    if (!handler) {
      throw new Error('Message handler not set');
    }

    act(() => {
      handler({
        type: 'editing_status_update',
        payload: {
          recordId: '456', // Different recordId
          users: ['otherUser1', 'otherUser2', 'testUser']
        }
      });
    });

    // Should still process messages for different recordId
    // but filter out the current user
    expect(result.current.editingUsers).toEqual(['otherUser1', 'otherUser2']);
    expect(mockOnEditingUsersChange).toHaveBeenCalledWith([
      'otherUser1',
      'otherUser2'
    ]);
  });
});
