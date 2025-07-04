export type WebSocketMessage =
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
