import { WEBSOCKET_CONFIG, WEBSOCKET_URL } from '@/constants/websocket';
import type { WebSocketMessage } from '@/types/websocket';
import { useEffect } from 'react';
import { create } from 'zustand';

type MessageHandler = (message: WebSocketMessage) => void;

interface WebSocketState {
  ws: WebSocket | null;
  isConnected: boolean;
  messageHandlers: Set<MessageHandler>;
  connect: (url?: string) => void;
  disconnect: () => void;
  sendMessage: (message: string) => void;
  subscribe: (handler: MessageHandler) => () => void;
  shouldReconnect: boolean;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  ws: null,
  isConnected: false,
  shouldReconnect: true,
  messageHandlers: new Set<MessageHandler>(),

  connect: (url = WEBSOCKET_URL) => {
    const { disconnect } = get();

    // Skip if already connected
    if (get().isConnected) return;

    // Close existing connection if any
    disconnect();

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        set({
          ws,
          isConnected: true
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { messageHandlers } = get();
          messageHandlers.forEach((handler) => handler(message));
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        const { shouldReconnect } = get();

        if (shouldReconnect) {
          const delay = WEBSOCKET_CONFIG.MAX_RECONNECT_DELAY;

          setTimeout(() => {
            if (get().shouldReconnect) {
              get().connect(url);
            }
          }, delay);
        } else {
          set({
            isConnected: false,
            ws: null,
            shouldReconnect: false
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      set({ ws });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      set({ isConnected: false });
    }
  },

  disconnect: () => {
    const { ws } = get();
    if (ws) {
      set({ shouldReconnect: false });
      ws.close();
      set({ ws: null, isConnected: false });
    }
  },

  sendMessage: (message: unknown) => {
    const { ws, isConnected } = get();
    if (isConnected && ws) {
      try {
        const messageStr =
          typeof message === 'string' ? message : JSON.stringify(message);
        ws.send(messageStr);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket is not connected');
    }
  },

  subscribe: (handler: MessageHandler) => {
    const { messageHandlers } = get();
    messageHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      messageHandlers.delete(handler);
    };
  }
}));

// Export hooks for use in other components
export const useWebSocketConnection = () => {
  const { isConnected } = useWebSocketStore();
  return { isConnected };
};

export const useWebSocketActions = () => {
  const { connect, disconnect, sendMessage, subscribe } = useWebSocketStore();
  return { connect, disconnect, sendMessage, subscribe };
};

export const useWebSocketMessage = (handler: MessageHandler) => {
  const { subscribe } = useWebSocketActions();

  useEffect(() => {
    const unsubscribe = subscribe(handler);
    return () => unsubscribe();
  }, [handler, subscribe]);
};
