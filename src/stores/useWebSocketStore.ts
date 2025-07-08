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
        console.log('WebSocket connected');
        set({
          ws,
          isConnected: true
        });
      };

      ws.onclose = () => {
        const { shouldReconnect } = get();

        if (shouldReconnect) {
          const delay = WEBSOCKET_CONFIG.RECONNECT_DELAY;

          console.log(`WebSocket closed. Reconnecting in ${delay}ms...`);

          setTimeout(() => {
            if (get().shouldReconnect) {
              get().connect(url);
            }
          }, delay);
        } else {
          console.log('WebSocket connection closed');
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
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
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
