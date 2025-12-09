export interface AppMessage {
  type: string;
  // 任意の追加フィールド
  [key: string]: unknown;
}

export interface NotificationHandler {
  canHandle(msg: AppMessage): boolean;
  handle(msg: AppMessage): void | Promise<void>;
}

export interface NotificationRouter {
  route(msg: AppMessage): void;
}


