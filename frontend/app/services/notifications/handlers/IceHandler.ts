import type { NotificationHandler, AppMessage } from "../interfaces";
import { applyRemoteIce } from "../../../services/videoChat/callSession";

export class IceHandler implements NotificationHandler {
  canHandle(msg: AppMessage): boolean {
    return String(msg?.type ?? "") === "webrtc_ice";
  }
  async handle(_msg: AppMessage): Promise<void> {
    const from = Number((_msg as any)?.from ?? 0);
    const candidate = (_msg as any)?.candidate as RTCIceCandidateInit | undefined;
    if (!from || !candidate) return;
    await applyRemoteIce(from, candidate);
  }
}


