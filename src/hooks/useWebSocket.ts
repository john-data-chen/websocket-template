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

export function useWebSocket(url: string, options: WebSocketOptions = {}) {
  const {
    onMessage,
    onOpen,
    onClose,
    onReconnectFailed,
    maxReconnectAttempts = WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS,
    reconnectDelay = WEBSOCKET_CONFIG.RECONNECT_DELAY,
    maxWaitTime = WEBSOCKET_CONFIG.MAX_WAIT_TIME
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

    if (ws.current) {
      ws.current.onopen = null;
      ws.current.onclose = null;
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
        setIsConnected(true);
        clearTimers();
        callbacksRef.current.onOpen?.();

        // Handle incoming WebSocket messages
        const handleMessage = (event: MessageEvent) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            callbacksRef.current.onMessage?.(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        socket.onmessage = handleMessage;
      };

      socket.onclose = () => {
        if (!isMounted.current) return;

        console.log('WebSocket disconnected');
        setIsConnected(false);
        callbacksRef.current.onClose?.();

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(
            reconnectDelay * Math.pow(2, reconnectAttempts.current),
            maxWaitTime
          );

          reconnectAttempts.current += 1;
          console.log(
            `Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts}) in ${delay}ms...`
          );

          reconnectTimer.current = setTimeout(connect, delay);
        } else {
          console.error('Max reconnection attempts reached');
          callbacksRef.current.onReconnectFailed?.();
        }
      };

      socket.onerror = (error) => {
        if (!isMounted.current) return;

        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }, [clearTimers, maxReconnectAttempts, maxWaitTime, reconnectDelay, url]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (!ws.current) {
      console.warn('WebSocket is not initialized');
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

    console.warn(
      `WebSocket is not connected. ReadyState: ${ws.current.readyState}`
    );
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

    return () => {
      isMounted.current = false;
      clearTimers();

      if (ws.current) {
        ws.current.onopen = null;
        ws.current.onclose = null;
        ws.current.onerror = null;
        ws.current.close();
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
