import { FORM_ATTRIBUTES } from '@/constants/formAttribute';
import { TOAST_CLASS, TOAST_MESSAGES } from '@/constants/toast';
import { WEBSOCKET_URL } from '@/constants/websocket';
import type { WebSocketMessage } from '@/types/websocket';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocket } from './useWebSocket';

interface UseWebSocketEditingOptions {
  recordId: string | null;
  currentUserName: string | null;
  onEditingUsersChange?: (users: string[]) => void;
}

export function useWebSocketEditing({
  recordId,
  currentUserName,
  onEditingUsersChange
}: UseWebSocketEditingOptions) {
  const [editingUsers, setEditingUsers] = useState<string[]>([]);
  const toastId = TOAST_CLASS;
  const hasSentStopMessage = useRef(false);

  // Show toast with message
  const showToast = useCallback(
    (message: string) => {
      const element = document.querySelector(
        `.${toastId}`
      ) as HTMLDivElement | null;
      if (element) {
        element.textContent = message;
        element.style.display = 'block';
      } else {
        console.error('Toast element not found');
      }
    },
    [toastId]
  );

  // Hide toast
  const hideToast = useCallback(() => {
    const element = document.querySelector(
      `.${toastId}`
    ) as HTMLDivElement | null;
    if (element) {
      element.style.display = 'none';
    }
  }, [toastId]);

  const handleWebSocketMessage = useCallback(
    (message: WebSocketMessage) => {
      if (message.type === 'editing_status_update' && recordId) {
        // Filter out the current user from the list of editing users
        const otherUsers = message.payload.users.filter(
          (user: string) =>
            user !== currentUserName &&
            user !== FORM_ATTRIBUTES.DEFAULTS.ANONYMOUS &&
            user.trim() !== ''
        );

        // Update the list of editing users
        setEditingUsers((prevUsers) => {
          // Only update if the list has actually changed
          if (
            prevUsers.length !== otherUsers.length ||
            !prevUsers.every((user, index) => user === otherUsers[index])
          ) {
            return otherUsers;
          }
          return prevUsers;
        });

        // Call the callback if provided
        if (onEditingUsersChange) {
          onEditingUsersChange(otherUsers);
        }

        // Show or update the toast notification with current editing users
        try {
          // Only show toast if there are other users editing
          if (otherUsers.length > 0) {
            const userList = otherUsers.join('、');
            const notificationMessage = `${TOAST_MESSAGES.EDITING_USERS}${userList}`;
            showToast(notificationMessage);
          } else {
            hideToast();
          }
        } catch (error) {
          console.error('Error showing toast:', error);
        }
      }
    },
    [recordId, currentUserName, onEditingUsersChange, showToast, hideToast]
  );

  const { sendMessage } = useWebSocket(WEBSOCKET_URL, {
    onMessage: handleWebSocketMessage
  });

  // Send start/stop editing messages when the component mounts/unmounts or recordId changes
  useEffect(() => {
    if (!recordId) return;

    // Reset the flag when recordId changes
    hasSentStopMessage.current = false;

    const message = {
      type: 'start_editing' as const,
      payload: {
        recordId: parseInt(recordId || '0', 10) || 0,
        userName: currentUserName || FORM_ATTRIBUTES.DEFAULTS.ANONYMOUS
      }
    };

    sendMessage(message);

    // Cleanup function
    return () => {
      // Only send stop_editing if we haven't already
      if (!hasSentStopMessage.current) {
        hasSentStopMessage.current = true;
        sendMessage({
          type: 'stop_editing',
          payload: {
            recordId: parseInt(recordId, 10) || 0,
            userName: currentUserName || FORM_ATTRIBUTES.DEFAULTS.ANONYMOUS
          }
        });
      }

      // Hide toast when unmounting
      hideToast();
    };
  }, [recordId, currentUserName, sendMessage, hideToast]);

  // Memoize the clearEditingNotification function to prevent unnecessary re-renders
  const clearEditingNotification = useCallback(() => {
    hideToast();
    setEditingUsers([]);
  }, [hideToast]);

  return {
    editingUsers,
    sendMessage,
    hideToast,
    clearEditingNotification
  };
}
