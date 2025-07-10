import { useCallback, useEffect, useRef, useState } from 'react';
import { WEBSOCKET_CONFIG } from '../constants/websocket';
import type { WebSocketMessage } from '../types/websocket';

export interface WebSocketOptions {
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  maxWaitTime?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onReconnectFailed?: () => void;
}

/**
 * Calculate reconnect delay using exponential backoff
 * @param attempt - Current retry attempt number
 * @returns Calculated delay in milliseconds
 */
const getReconnectDelay = (attempt: number) =>
  Math.min(
    WEBSOCKET_CONFIG.DEFAULT_RECONNECT_DELAY * Math.pow(2, attempt),
    WEBSOCKET_CONFIG.MAX_RECONNECT_DELAY
  );

export function useWebSocket(url: string, options: WebSocketOptions = {}) {
  // Destructure options with defaults
  const {
    onMessage,
    onOpen,
    onClose,
    onReconnectFailed,
    maxReconnectAttempts = WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS,
    // Keep these for backward compatibility
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reconnectDelay: _reconnectDelay = WEBSOCKET_CONFIG.DEFAULT_RECONNECT_DELAY,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    maxWaitTime: _maxWaitTime = WEBSOCKET_CONFIG.MAX_RECONNECT_DELAY
  } = options;

  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize callbacks ref with the latest values
  const callbacksRef = useRef({
    onMessage,
    onOpen,
    onClose,
    onReconnectFailed
  });

  // Update callbacks when they change
  useEffect(() => {
    callbacksRef.current = {
      onMessage,
      onOpen,
      onClose,
      onReconnectFailed
    };
  }, [onMessage, onOpen, onClose, onReconnectFailed]);

  // Cleanup timers and WebSocket connection
  const clearTimers = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!isMounted.current) return;

    // Clean up existing connection if any
    if (ws.current) {
      ws.current.onopen = null;
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.close();
    }

    try {
      const socket = new WebSocket(url);
      ws.current = socket;

      socket.onopen = () => {
        if (!isMounted.current) {
          socket.close();
          return;
        }
        reconnectAttempts.current = 0; // Reset retry counter
        setIsConnected(true);
        clearTimers();
        callbacksRef.current.onOpen?.();
      };

      // Handle incoming messages
      const handleMessage = (event: MessageEvent) => {
        if (!isMounted.current) return;

        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          callbacksRef.current.onMessage?.(message);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      socket.onmessage = handleMessage;

      socket.onclose = () => {
        if (!isMounted.current) return;
        setIsConnected(false);
        callbacksRef.current.onClose?.();

        // Auto-reconnect logic
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = getReconnectDelay(reconnectAttempts.current);
          reconnectTimer.current = setTimeout(() => {
            if (isMounted.current) {
              reconnectAttempts.current += 1;
              connect();
            }
          }, delay);
        } else {
          console.error('[WebSocket] Max reconnection attempts reached');
          callbacksRef.current.onReconnectFailed?.();
        }
      };

      socket.onerror = (error) => {
        if (!isMounted.current) return;
        console.error('[WebSocket] Connection error:', error);
      };
    } catch (error) {
      console.error('[WebSocket] Error creating connection:', error);

      // Attempt to reconnect on error
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = getReconnectDelay(reconnectAttempts.current);
        reconnectTimer.current = setTimeout(() => {
          if (isMounted.current) {
            reconnectAttempts.current += 1;
            connect();
          }
        }, delay);
      } else {
        console.error(
          '[WebSocket] Max reconnection attempts reached after error'
        );
        callbacksRef.current.onReconnectFailed?.();
      }
    }
  }, [clearTimers, maxReconnectAttempts, url]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (!ws.current) {
      // console.warn('WebSocket is not initialized');
      return false;
    }

    if (ws.current.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    }

    //console.warn(
    //  `WebSocket is not connected. ReadyState: ${ws.current.readyState}`
    //);
    return false;
  }, []);

  // Setup ping interval when connected
  useEffect(() => {
    if (!isConnected) return;

    const pingTimer = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        sendMessage({ type: 'ping' });
      }
    }, WEBSOCKET_CONFIG.PING_INTERVAL);

    return () => {
      clearInterval(pingTimer);
    };
  }, [isConnected, sendMessage]);

  // Initialize WebSocket connection
  useEffect(() => {
    isMounted.current = true;
    connect();

    // Cleanup function
    return () => {
      isMounted.current = false;
      clearTimers();

      // Clean up WebSocket connection
      if (ws.current) {
        const { CLOSING, CLOSED } = WebSocket;

        // Only clean up if not already closed or closing
        if (
          ws.current.readyState !== CLOSED &&
          ws.current.readyState !== CLOSING
        ) {
          // Remove all event listeners
          ws.current.onopen = null;
          ws.current.onclose = null;
          ws.current.onmessage = null;
          ws.current.onerror = null;

          // If connection is open, send close frame
          if (ws.current.readyState === WebSocket.OPEN) {
            try {
              ws.current.close(
                WEBSOCKET_CONFIG.NORMAL_CLOSURE,
                'Component unmounting'
              );
            } catch (error) {
              console.error(
                '[WebSocket] Error while closing connection:',
                error
              );
            }
          } else {
            ws.current.close();
          }
        }

        ws.current = null;
      }
    };
  }, [connect, clearTimers]);

  return {
    isConnected,
    sendMessage,
    reconnect: connect
  };
}
