export type SignalingMessage =
  | { type: "webrtc_offer"; to: number; sdp: RTCSessionDescriptionInit }
  | { type: "webrtc_answer"; to: number; sdp: RTCSessionDescriptionInit }
  | { type: "webrtc_ice"; to: number; candidate: RTCIceCandidateInit }
  | { type: "webrtc_error"; reason: string; to?: number; originalType?: string }
  | { type: string; [key: string]: any }; // 拡張性
