import type { AppMessage, NotificationHandler, NotificationRouter } from "./interfaces";

export function createNotificationRouter(handlers: NotificationHandler[]): NotificationRouter {
  return {
    route(msg: AppMessage) {
      for (const h of handlers) {
        if (h.canHandle(msg)) {
          void h.handle(msg);
          return;
        }
      }
      // 未対応タイプ: ログ or 無視
    },
  };
}


