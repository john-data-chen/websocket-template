export const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;

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
