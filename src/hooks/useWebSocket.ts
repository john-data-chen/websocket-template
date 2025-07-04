import type { WebSocketMessage } from '@/constants/websocket';
import { useCallback, useEffect, useRef } from 'react';

type WebSocketCallbacks = {
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
};

export function useWebSocket(
  url: string,
  { onMessage, onOpen, onClose, onError }: WebSocketCallbacks = {}
) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const isMounted = useRef(true);
  const maxReconnectAttempts = 5;
  const reconnectInterval = 3000; // 3 seconds

  // Save callback references to avoid unnecessary re-connections
  const callbacksRef = useRef({ onMessage, onOpen, onClose, onError });

  // Update callback references when they change
  useEffect(() => {
    callbacksRef.current = { onMessage, onOpen, onClose, onError };
  }, [onMessage, onOpen, onClose, onError]);

  const connect = useCallback(() => {
    if (!isMounted.current) return;

    if (ws.current) {
      ws.current.onopen = null;
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.onmessage = null;
      ws.current.close();
    }

    try {
      console.log(`Connecting to WebSocket: ${url}`);
      const socket = new WebSocket(url);
      ws.current = socket;

      socket.onopen = () => {
        if (!isMounted.current) {
          socket.close();
          return;
        }
        console.log('WebSocket connected');
        reconnectAttempts.current = 0;
        callbacksRef.current.onOpen?.();
      };

      socket.onmessage = (event) => {
        if (!isMounted.current) return;

        try {
          // Check if it's a valid JSON string
          if (typeof event.data === 'string') {
            const message = JSON.parse(event.data) as WebSocketMessage;
            callbacksRef.current.onMessage?.(message);
          } else {
            console.warn('Received non-string WebSocket message:', event.data);
          }
        } catch (error) {
          console.error(
            'Error parsing WebSocket message:',
            error,
            'Data:',
            event.data
          );
        }
      };

      socket.onclose = () => {
        if (!isMounted.current) return;

        console.log('WebSocket disconnected');
        callbacksRef.current.onClose?.();

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          console.log(
            `Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`
          );
          setTimeout(connect, reconnectInterval);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };

      socket.onerror = (error) => {
        if (!isMounted.current) return;

        console.error('WebSocket error:', error);
        console.error('WebSocket readyState:', socket.readyState);
        console.error('WebSocket URL:', url);

        // If connection is closed, attempt to reconnect
        if (socket.readyState === WebSocket.CLOSED) {
          console.log(
            'WebSocket connection closed, attempting to reconnect...'
          );
          setTimeout(connect, reconnectInterval);
        }

        callbacksRef.current.onError?.(error);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }, [url]);

  const sendMessage = useCallback(
    (message: WebSocketMessage) => {
      if (!ws.current) {
        console.warn('WebSocket is not initialized');
        return false;
      }

      if (ws.current.readyState === WebSocket.OPEN) {
        try {
          ws.current.send(JSON.stringify(message));
          console.log('WebSocket message sent:', message);
          return true;
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
          return false;
        }
      }

      console.warn(
        `WebSocket is not connected. ReadyState: ${ws.current.readyState}`
      );

      // If connection is closed, attempt to reconnect
      if (ws.current.readyState === WebSocket.CLOSED) {
        console.log('Attempting to reconnect...');
        connect();
      }

      return false;
    },
    [connect]
  );

  useEffect(() => {
    isMounted.current = true;
    connect();

    return () => {
      isMounted.current = false;
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [connect]);

  return { sendMessage };
}
