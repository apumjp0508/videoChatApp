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