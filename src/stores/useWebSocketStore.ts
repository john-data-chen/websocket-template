import { WEBSOCKET_CONFIG, WEBSOCKET_URL } from '@/constants/websocket';
import { create } from 'zustand';

interface WebSocketState {
  ws: WebSocket | null;
  isConnected: boolean;
  connect: (url?: string) => void;
  disconnect: () => void;
  sendMessage: (message: string) => void;
  shouldReconnect: boolean;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  ws: null,
  isConnected: false,
  shouldReconnect: true,

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

      ws.onmessage = (event) => {
        try {
          // Parse the message but don't assign to a variable since it's handled by another store
          JSON.parse(event.data);
          // use another store to manage received message state
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
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

  sendMessage: (message: string) => {
    const { ws, isConnected } = get();
    if (isConnected && ws) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket is not connected');
    }
  }
}));

// Export hooks for use in other components
export const useWebSocketConnection = () => {
  const { isConnected } = useWebSocketStore();
  return { isConnected };
};

export const useWebSocketActions = () => {
  const { connect, disconnect, sendMessage } = useWebSocketStore();
  return { connect, disconnect, sendMessage };
};
