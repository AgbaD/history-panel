export type RuntimeMessage =
  | { type: 'ACTIVE_URL'; url: string }
  | { type: 'PING' };
