export const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;

export const MESSAGE_TYPES = {
  // Connection events
  USER_CONNECTED: 'user_connected',
  USER_DISCONNECTED: 'user_disconnected',
  USER_UPDATED: 'user_updated',

  // System messages
  PING: 'ping',
  PONG: 'pong',
  ERROR: 'error',

  // Chat messages
  MESSAGE: 'message',

  // Editing events
  START_EDITING: 'start_editing',
  STOP_EDITING: 'stop_editing',
  EDITING_STATUS_UPDATE: 'editing_status_update'
} as const;

export const WEBSOCKET_CONFIG = {
  // Reconnection settings
  DEFAULT_RECONNECT_DELAY: 1000, // Initial retry delay in ms
  MAX_RECONNECT_ATTEMPTS: 5, // Maximum number of retry attempts
  MAX_RECONNECT_DELAY: 30000, // Maximum delay between retries in ms

  // Connection settings
  PING_INTERVAL: 30000, // Ping interval in ms

  // Close codes
  NORMAL_CLOSURE: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS_RECEIVED: 1005,
  ABNORMAL_CLOSURE: 1006,
  INVALID_FRAME_PAYLOAD_DATA: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  MISSING_EXTENSION: 1010,
  INTERNAL_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  BAD_GATEWAY: 1014,
  TLS_HANDSHAKE: 1015
} as const;

export const EDITING_EVENTS = {
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left'
} as const;
