export const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;

export const WEBSOCKET_CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 3000, // 3 seconds base delay
  TOAST_DURATION: 5000, // 5 seconds for toast messages
  MAX_WAIT_TIME: 30000, // 30 seconds maximum wait time
  PING_INTERVAL: 30000 // 30 seconds for ping interval
} as const;
