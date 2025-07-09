import { v4 as uuidv4 } from 'uuid';

// Generate random numeric ID (for WebSocket communication)
export const generateNumericId = (): number => {
  const maxSafeInteger = Number.MAX_SAFE_INTEGER;
  // random() might have code smell issue, but it's ok for this simple case
  return Math.floor(Math.random() * maxSafeInteger);
};

// Generate UUID (for local rendering)
export const generateUuid = (): string => {
  return uuidv4();
};

// Check if an ID is numeric (for WebSocket communication)
export const isNumericId = (id: string | number): boolean => {
  return typeof id === 'number' || /^\d+$/.test(id.toString());
};
