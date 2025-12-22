export type MessageType = "friend_request" | "info" | "warning" | string;

export interface NotificationItem {
  message: string;
  messageType: MessageType;
}
