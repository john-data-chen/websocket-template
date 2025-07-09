import { FORM_ATTRIBUTES } from '@/constants/formAttribute';
import { TOAST_MESSAGES } from '@/constants/toast';
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
  console.log('useWebSocketEditing hook is running with recordId:', recordId);
  const [editingUsers, setEditingUsers] = useState<string[]>([]);
  const toastId = 'editing-users-toast';
  const hasSentStopMessage = useRef(false);

  // Show toast with message
  const showToast = useCallback(
    (message: string) => {
      const element = document.getElementById(toastId) as HTMLDivElement;
      if (element) {
        element.textContent = message;
        element.style.display = 'block';
        console.log('Toast shown with message:', message);
      } else {
        console.error('Toast element not found');
      }
    },
    [toastId]
  );

  // Hide toast
  const hideToast = useCallback(() => {
    const element = document.getElementById(toastId) as HTMLDivElement;
    if (element) {
      element.style.display = 'none';
      console.log('Toast hidden');
    }
  }, [toastId]);

  const handleWebSocketMessage = useCallback(
    (message: WebSocketMessage) => {
      console.log('Received WebSocket message:', message);

      if (message.type === 'editing_status_update' && recordId) {
        console.log('Processing editing_status_update for recordId:', recordId);
        console.log(
          'Message recordId:',
          message.payload.recordId,
          'Type:',
          typeof message.payload.recordId
        );
        console.log('Local recordId:', recordId, 'Type:', typeof recordId);

        // Filter out the current user from the list of editing users
        const otherUsers = message.payload.users.filter(
          (user: string) =>
            user !== currentUserName &&
            user !== FORM_ATTRIBUTES.DEFAULTS.ANONYMOUS &&
            user.trim() !== ''
        );

        console.log('Processing editing status:', {
          messageRecordId: message.payload.recordId,
          currentRecordId: recordId,
          allUsers: message.payload.users,
          filteredUsers: otherUsers,
          currentUserName
        });

        // Update the list of editing users
        setEditingUsers((prevUsers) => {
          // Only update if the list has actually changed
          if (
            prevUsers.length !== otherUsers.length ||
            !prevUsers.every((user, index) => user === otherUsers[index])
          ) {
            console.log('Updating editing users:', otherUsers);
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

            console.log('Showing toast with users:', otherUsers);
            showToast(notificationMessage);
          } else {
            console.log('No other users editing, hiding toast');
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

    // Log when effect runs
    console.log('[Toast Debug] Effect running for recordId:', recordId);

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
      console.log('[Toast Debug] Cleanup function running');

      // Only send stop_editing if we haven't already
      if (!hasSentStopMessage.current) {
        console.log('[Toast Debug] Sending stop_editing message');
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

  return {
    editingUsers,
    sendMessage,
    clearEditingNotification: hideToast
  };
}
