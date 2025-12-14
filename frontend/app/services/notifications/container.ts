import { createNotificationRouter } from "./router";
import { FriendRequestHandler } from "./handlers/friendRequest";
import { OfferHandler } from "./handlers/OfferHandler";
import { AnswerHandler } from "./handlers/AnswerHandler";
import { IceHandler } from "./handlers/IceHandler";
import { TranscriptHandler } from "./handlers/TranscriptHandler";
import type { NotificationRouter } from "./interfaces";

class NotificationContainer {
  readonly router: NotificationRouter;

  constructor() {
    const handlers = [
      // app-level notifications
      new FriendRequestHandler(),
      // signaling messages (webrtc)
      new OfferHandler(),
      new AnswerHandler(),
      new IceHandler(),
      // streaming transcript
      new TranscriptHandler(),
    ];
    this.router = createNotificationRouter(handlers);
  }
}

export const notificationContainer = new NotificationContainer();


