import type { NotificationHandler, AppMessage } from "../interfaces";
import { handleRemoteAnswer } from "../../../services/videoChat/callSession";

export class AnswerHandler implements NotificationHandler {
  canHandle(msg: AppMessage): boolean {
    return String(msg?.type ?? "") === "webrtc_answer";
  }
  async handle(_msg: AppMessage): Promise<void> {
    const from = Number((_msg as any)?.from ?? 0);
    const sdp = (_msg as any)?.sdp as RTCSessionDescriptionInit | undefined;
    if (!from || !sdp) return;
    await handleRemoteAnswer(from, sdp);
  }
}


