export type UserData = {
  id: string | number;
  name: string;
  email: string;
  isActive: boolean;
  description: string;
};

export type MessageData = {
  id: string | number;
  content: string;
  timestamp: string;
  userId: string | number;
};

export type WebSocketMessage =
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
        recordId: string;
        userName: string;
      };
    }
  | {
      type: 'editing_status_update';
      payload: {
        recordId: string;
        users: string[];
      };
    };
