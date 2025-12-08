export type SignalingHandlers = {
  onOffer?: (data: { from: number; sdp: RTCSessionDescriptionInit }) => void;
  onAnswer?: (data: { from: number; sdp: RTCSessionDescriptionInit }) => void;
  onIce?: (data: { from: number; candidate: RTCIceCandidateInit }) => void;
  onError?: (data: { reason: string; to?: number; originalType?: string }) => void;
};

import type { SignalingMessage } from "../../types/signalingMess";

export function sendOffer(ws: WebSocket, toUserId: number, sdp: RTCSessionDescriptionInit) {
  const msg: SignalingMessage = {
    type: "webrtc_offer",
    to: toUserId,
    sdp,
  };
  ws.send(JSON.stringify(msg));
}

export function sendAnswer(ws: WebSocket, toUserId: number, sdp: RTCSessionDescriptionInit) {
  const msg: SignalingMessage = {
    type: "webrtc_answer",
    to: toUserId,
    sdp,
  };
  console.log("send answer:", msg);
  ws.send(JSON.stringify(msg));
}

export function sendIce(ws: WebSocket, toUserId: number, candidate: RTCIceCandidateInit) {
  const msg: SignalingMessage = {
    type: "webrtc_ice",
    to: toUserId,
    candidate,
  };
  ws.send(JSON.stringify(msg));
}

export function attachSignalingHandlers(
  ws: WebSocket,
  handlers: SignalingHandlers,
  extras?: { onMessage?: (data: any) => void }
) {
  const listener = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      switch (data?.type) {
        case "webrtc_offer":
          handlers.onOffer?.({ from: Number(data.from), sdp: data.sdp });
          return;
        case "webrtc_answer":
          handlers.onAnswer?.({ from: Number(data.from), sdp: data.sdp });
          return;
        case "webrtc_ice":
          handlers.onIce?.({ from: Number(data.from), candidate: data.candidate });
          return;
        case "webrtc_error":
          handlers.onError?.({
            reason: String(data.reason ?? "unknown"),
            to: typeof data.to === "number" ? data.to : undefined,
            originalType: typeof data.originalType === "string" ? data.originalType : undefined,
          });
          return;
        default:
          // 非シグナリングメッセージは呼び出し元へ転送
          extras?.onMessage?.(data);
          return;
      }
    } catch {
      // ignore parse errors here; upstream handlers may deal with raw messages
    }
  };
  ws.addEventListener("message", listener);
  return () => ws.removeEventListener("message", listener);
}