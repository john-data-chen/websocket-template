import { TOAST_MESSAGES } from '@/constants/toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useWebSocketEditing } from '@/hooks/useWebSocketEditing';
import { act, renderHook } from '@testing-library/react';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the document object for toast element
const mockQuerySelector = vi.spyOn(document, 'querySelector');

// Mock the useWebSocket hook
vi.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: vi.fn()
}));

// Mock the document.querySelector for toast element
const mockToastElement = document.createElement('div');
mockToastElement.style.display = 'none';
mockQuerySelector.mockReturnValue(mockToastElement);

describe('useWebSocketEditing', () => {
  const mockSendMessage = vi.fn();
  const mockOnEditingUsersChange = vi.fn();

  const defaultProps = {
    recordId: '123',
    currentUserName: 'testUser',
    onEditingUsersChange: mockOnEditingUsersChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useWebSocket as ReturnType<typeof vi.fn>).mockReturnValue({
      sendMessage: mockSendMessage
    });
  });

  afterAll(() => {
    mockQuerySelector.mockRestore();
  });

  it('should initialize with empty editing users', () => {
    const { result } = renderHook(() => useWebSocketEditing(defaultProps));

    expect(result.current.editingUsers).toEqual([]);
  });

  it('should send start_editing message on mount', () => {
    renderHook(() => useWebSocketEditing(defaultProps));

    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'start_editing',
      payload: {
        recordId: 123,
        userName: 'testUser'
      }
    });
  });

  it('should send stop_editing message on unmount', () => {
    const { unmount } = renderHook(() => useWebSocketEditing(defaultProps));

    unmount();

    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'stop_editing',
      payload: {
        recordId: 123,
        userName: 'testUser'
      }
    });
  });

  it('should update editing users and show toast on editing_status_update', () => {
    const { result } = renderHook(() => useWebSocketEditing(defaultProps));

    const messageHandler = (useWebSocket as ReturnType<typeof vi.fn>).mock
      .calls[0][1].onMessage;

    act(() => {
      messageHandler({
        type: 'editing_status_update',
        payload: {
          recordId: '123',
          users: ['otherUser1', 'testUser', 'otherUser2']
        }
      });
    });

    // Should filter out current user and update editingUsers
    expect(result.current.editingUsers).toEqual(['otherUser1', 'otherUser2']);
    expect(mockOnEditingUsersChange).toHaveBeenCalledWith([
      'otherUser1',
      'otherUser2'
    ]);

    // Should show toast with editing users
    expect(mockToastElement.textContent).toBe(
      `${TOAST_MESSAGES.EDITING_USERS}otherUser1、otherUser2`
    );
    expect(mockToastElement.style.display).toBe('block');
  });

  it('should hide toast when no other users are editing', () => {
    const { result } = renderHook(() => useWebSocketEditing(defaultProps));

    const messageHandler = (useWebSocket as ReturnType<typeof vi.fn>).mock
      .calls[0][1].onMessage;

    // First, simulate users editing
    act(() => {
      messageHandler({
        type: 'editing_status_update',
        payload: {
          recordId: '123',
          users: ['testUser', 'otherUser']
        }
      });
    });

    // Then simulate no other users editing
    act(() => {
      messageHandler({
        type: 'editing_status_update',
        payload: {
          recordId: '123',
          users: ['testUser']
        }
      });
    });

    expect(result.current.editingUsers).toEqual([]);
    expect(mockOnEditingUsersChange).toHaveBeenCalledWith([]);
    expect(mockToastElement.style.display).toBe('none');
  });

  it('should handle clearEditingNotification', () => {
    const { result } = renderHook(() => useWebSocketEditing(defaultProps));

    // Set some initial state
    act(() => {
      result.current.clearEditingNotification();
    });

    expect(result.current.editingUsers).toEqual([]);
    expect(mockToastElement.style.display).toBe('none');
  });

  it('should handle hideToast', () => {
    const { result } = renderHook(() => useWebSocketEditing(defaultProps));

    // First show the toast
    mockToastElement.style.display = 'block';

    act(() => {
      result.current.hideToast();
    });

    expect(mockToastElement.style.display).toBe('none');
  });

  it('should process messages for any recordId', () => {
    const { result } = renderHook(() => useWebSocketEditing(defaultProps));

    const messageHandler = (useWebSocket as ReturnType<typeof vi.fn>).mock
      .calls[0][1].onMessage;

    act(() => {
      messageHandler({
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
