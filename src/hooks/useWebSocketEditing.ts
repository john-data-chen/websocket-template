import { FORM_ATTRIBUTES } from '@/constants/formAttribute';
import { TOAST_MESSAGES } from '@/constants/toast';
import { MESSAGE_TYPES } from '@/constants/websocket';
import {
  useWebSocketActions,
  useWebSocketMessage
} from '@/stores/useWebSocketStore';
import type { WebSocketMessage } from '@/types/websocket';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from './useToast';

interface UseWebSocketEditingOptions {
  recordId: string | null;
  currentUserName: string | null;
  onEditingUsersChange?: (users: string[]) => void;
}

/**
 * Hook to manage WebSocket-based collaborative editing state
 * @param options - Configuration options including recordId, currentUserName, and callbacks
 * @returns Object containing editing state and utility functions
 */
export function useWebSocketEditing({
  recordId,
  currentUserName,
  onEditingUsersChange
}: UseWebSocketEditingOptions) {
  const [editingUsers, setEditingUsers] = useState<string[]>([]);
  const hasSentStopMessage = useRef(false);
  const { showToast, hideToast } = useToast();

  const handleWebSocketMessage = useCallback(
    (message: WebSocketMessage) => {
      if (message.type === MESSAGE_TYPES.EDITING_STATUS_UPDATE && recordId) {
        // Type guard to ensure we have the correct message type
        if (!('payload' in message) || !('users' in message.payload)) {
          console.error(
            '[useWebSocketEditing] Invalid editing status update message:',
            message
          );
          return;
        }

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
          const shouldUpdate =
            prevUsers.length !== otherUsers.length ||
            !prevUsers.every((user, index) => user === otherUsers[index]);

          if (shouldUpdate) {
            // in development, add a log here and it will pop twice because of the React StrictMode, this is not a bug, and won't affect the production
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

  // Memoize the clearEditingNotification function to prevent unnecessary re-renders
  const clearEditingNotification = useCallback(() => {
    try {
      hideToast();
      setEditingUsers([]);
    } catch (error) {
      console.error(
        '[useWebSocketEditing] Error clearing notifications:',
        error
      );
    }
  }, [hideToast]);

  const { sendMessage } = useWebSocketActions();

  // Subscribe to WebSocket messages
  useWebSocketMessage(handleWebSocketMessage);

  // Send start/stop editing messages when the component mounts/unmounts or recordId changes
  useEffect(() => {
    if (!recordId) return;

    // Reset the flag when recordId changes
    hasSentStopMessage.current = false;

    // Send start_editing message
    const message: WebSocketMessage = {
      type: MESSAGE_TYPES.START_EDITING,
      payload: {
        recordId: Number(recordId),
        userName: currentUserName || FORM_ATTRIBUTES.DEFAULTS.ANONYMOUS
      }
    };
    sendMessage(JSON.stringify(message));

    // Cleanup function
    return () => {
      // Only send stop_editing if we haven't already sent it and recordId is not null
      if (!hasSentStopMessage.current && recordId) {
        hasSentStopMessage.current = true;
        const message: WebSocketMessage = {
          type: MESSAGE_TYPES.STOP_EDITING,
          payload: {
            recordId: Number(recordId),
            userName: currentUserName || FORM_ATTRIBUTES.DEFAULTS.ANONYMOUS
          }
        };
        sendMessage(JSON.stringify(message));
      } else {
        // console.log(
        //   '[useWebSocketEditing] Skip sending stop_editing - already sent or no recordId'
        // );
      }
      clearEditingNotification();
    };
  }, [recordId, currentUserName, sendMessage, clearEditingNotification]);

  return {
    editingUsers,
    sendMessage,
    hideToast,
    clearEditingNotification
  };
}
