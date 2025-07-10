import { MESSAGE_TYPES } from '@/constants/websocket';

/**
 * Represents a user in the system
 */
export interface UserData {
  id: string | number;
  name: string;
  email: string;
  isActive: boolean;
  description: string;
}

/**
 * Represents a chat message
 */
export interface MessageData {
  id: string | number;
  content: string;
  timestamp: string;
  userId: string | number;
}

/**
 * Payload for editing-related messages
 */
export interface EditingPayload {
  recordId: number;
  userName: string;
}

/**
 * Payload for editing status update messages
 */
export interface EditingStatusPayload {
  recordId: number;
  users: string[];
}

/**
 * Union type of all possible WebSocket message types
 */
export type WebSocketMessage =
  // Connection events
  | { type: typeof MESSAGE_TYPES.USER_CONNECTED; user: UserData }
  | { type: typeof MESSAGE_TYPES.USER_DISCONNECTED; userId: string | number }
  | { type: typeof MESSAGE_TYPES.USER_UPDATED; user: UserData }

  // Chat messages
  | { type: 'message'; message: MessageData }

  // System messages
  | { type: 'error'; error: string }
  | { type: 'ping' }
  | { type: 'pong' }

  // Editing events
  | { type: typeof MESSAGE_TYPES.START_EDITING; payload: EditingPayload }
  | { type: typeof MESSAGE_TYPES.STOP_EDITING; payload: EditingPayload }
  | {
      type: typeof MESSAGE_TYPES.EDITING_STATUS_UPDATE;
      payload: EditingStatusPayload;
    };
