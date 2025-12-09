import { useNotificationStore } from "../../../types/notificationStore";
import type { MessageType } from "../../../types/notification";
import type { AppMessage, NotificationHandler } from "../interfaces";

export class FriendRequestHandler implements NotificationHandler {
  canHandle(msg: AppMessage): boolean {
    return String(msg?.type ?? "") === "friend_request";
  }

  handle(msg: AppMessage): void {
    const add = useNotificationStore.getState().add;
    const from = Number((msg as any)?.requestUserID ?? 0);
    const text: string = String((msg as any)?.message ?? "");
    const messageType: MessageType = String((msg as any)?.type ?? "info");
    add(from, {
      message: text,
      messageType,
    });
  }
}


