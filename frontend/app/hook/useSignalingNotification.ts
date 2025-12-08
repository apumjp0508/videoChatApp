"use client";

import { useEffect } from "react";
import { attachSignalingHandlers, SignalingHandlers } from "../services/websocket/signaling";

export function useSignalingNotification(
  socket: WebSocket | null,
  onMessage: (msg: any) => void,
  signalingHandlers?: {
    onOffer?: (ws: WebSocket, data: { from: number; sdp: RTCSessionDescriptionInit }) => void;
    onAnswer?: (ws: WebSocket, data: { from: number; sdp: RTCSessionDescriptionInit }) => void;
    onIce?: (ws: WebSocket, data: { from: number; candidate: RTCIceCandidateInit }) => void;
    onError?: (ws: WebSocket, data: { reason: string; to?: number; originalType?: string }) => void;
  }
) {
  useEffect(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    let detachSignaling: (() => void) | null = null;

    // シグナリング受信（追加ハンドラ）
    const handlers: SignalingHandlers = {
      onOffer: (d) => signalingHandlers?.onOffer?.(socket, d),
      onAnswer: (d) => signalingHandlers?.onAnswer?.(socket, d),
      onIce: (d) => signalingHandlers?.onIce?.(socket, d),
      onError: (d) => signalingHandlers?.onError?.(socket, d),
    };
    detachSignaling = attachSignalingHandlers(socket, handlers, { onMessage });

    return () => {
      detachSignaling?.();
    };
  }, [socket, onMessage, signalingHandlers]);
}
