import type { WebSocketMessage } from '@/types/websocket';

export const WEBSOCKET_URL = 'wss://fe-ws.commeet.co/ws';

export type { WebSocketMessage };

export const createWebSocketMessage = (
  type: WebSocketMessage['type'],
  payload: WebSocketMessage['payload']
): string => {
  return JSON.stringify({ type, payload });
};
