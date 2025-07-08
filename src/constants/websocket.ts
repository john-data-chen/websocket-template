export const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;

export const WEBSOCKET_CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 3000, // 3 seconds base delay
  TOAST_DURATION: 5000, // 5 seconds for toast messages
  MAX_WAIT_TIME: 30000, // 30 seconds maximum wait time
  PING_INTERVAL: 30000 // 30 seconds for ping interval
} as const;

type UserData = {
  id: string | number;
  name: string;
  email: string;
  isActive: boolean;
  description: string;
};

type MessageData = {
  id: string | number;
  content: string;
  timestamp: string;
  userId: string | number;
};

type WebSocketMessage =
  | { type: 'user_connected'; user: UserData }
  | { type: 'user_disconnected'; userId: string | number }
  | { type: 'user_updated'; user: UserData }
  | { type: 'message'; message: MessageData }
  | { type: 'error'; error: string }
  | { type: 'ping' }
  | { type: 'pong' }
  | {
      type: 'start_editing' | 'stop_editing';
      payload: {
        recordId: number;
        userName: string;
      };
    }
  | {
      type: 'editing_status_update';
      payload: {
        recordId: number;
        users: string[];
      };
    };

export type { WebSocketMessage, UserData, MessageData };
