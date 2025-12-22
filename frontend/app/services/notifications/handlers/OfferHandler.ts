import type { NotificationHandler, AppMessage } from "../interfaces";
import { useCallOfferStore } from "../../../types/VideooChat/callOfferStore";

export class OfferHandler implements NotificationHandler {
  canHandle(msg: AppMessage): boolean {
    return String(msg?.type ?? "") === "webrtc_offer";
  }
  handle(_msg: AppMessage): void {
    const from = Number((_msg as any)?.from ?? 0);
    const sdp = (_msg as any)?.sdp as RTCSessionDescriptionInit | undefined;
    if (!from || !sdp) return;
    const add = useCallOfferStore.getState().add;
    add(from, sdp);
  }
}


