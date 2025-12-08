"use client";

import { useCallback, useRef, useState } from "react";
import { useSignalingNotification } from "./useSignalingNotification";
import { acceptCall } from "../services/videoChat/startChatOffer";
import { applyRemoteIce, handleRemoteAnswer } from "../services/videoChat/callSession";
import { postWithAuth } from "../utils/postWithAuth";
import { API_BASE } from "../utils/apiBase";
import { NotificationItem } from "../types/notification";
import { useWebSocketStore } from "../types/websocketStore";

export function useNotifications(userID: number, token: string) {
  // friendRequests: フレンド申請（friend_request）専用の通知ボックス
  const [friendRequests, setFriendRequests] = useState<Record<number, NotificationItem>>({});
  const socketRef = useRef<WebSocket | null>(null);
  const peersRef = useRef<Map<number, RTCPeerConnection>>(new Map());
  // call offers: webrtc_offer を保持する（fromUserId -> SDP）
  const pendingOffersRef = useRef<Map<number, RTCSessionDescriptionInit>>(new Map());
  const { ws } = useWebSocketStore();

  const onMessage = useCallback((msg: any) => {
    console.log("messageType:", msg?.type);
    if (msg?.type === "friend_request") {
      const from = Number(msg.requestUserID);
      setFriendRequests((prev) => ({
        //スプレッド構文で既存の通知に新規追加するための構文
        ...prev,
        [from]: {
          message: String(msg.message ?? ""),
          messageType: String(msg.type ?? "info"),
        },
      }));
    }
  }, []);

  const clearFriendRequest = useCallback((requestUserID: number) => {
    setFriendRequests((prev) => {
      const next = { ...prev };
      delete next[requestUserID];
      return next;
    });
  }, []);

  // start listening for websocket notifications and signaling events
  useSignalingNotification(ws, onMessage, {
    onOffer: (ws, { from, sdp }) => {
      socketRef.current = ws;
      pendingOffersRef.current.set(from, sdp);
    },
    onAnswer: async (_ws, { from, sdp }) => {
      console.log("onanswer sdp:", sdp);
      await handleRemoteAnswer(from, sdp);
    },
    onIce: async (_ws, { from, candidate }) => {
      const pc = peersRef.current.get(from);
      if (pc) {
        await applyRemoteIce(from, candidate, peersRef.current);
      }
    },
  });

  // 友達申請の承認（HTTPのみ、WS/SDP依存なし）
  const acceptFriendRequest = useCallback(
    async (requestUserID: number) => {
      try {
        await postWithAuth(`${API_BASE}/api/friend/request/approve`, {
          requestUserID: Number(requestUserID),
          userID: Number(userID),
        });
        clearFriendRequest(requestUserID);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("acceptFriendRequest error", e);
        throw e;
      }
    },
    [userID, clearFriendRequest]
  );

  // 通話リクエストの承諾（WS + SDP 必須）
  const acceptCallRequest = useCallback(
    async (fromUserID: number) => {
      const wsCur = ws ?? socketRef.current;
      const sdp = pendingOffersRef.current.get(fromUserID);
      if (!wsCur || wsCur.readyState !== WebSocket.OPEN || !sdp) return;

      try {
        const pc = await acceptCall(wsCur, fromUserID, sdp);
        //peersRef：通話中のユーザーと RTCPeerConnection を紐づけて保持するための Map
        peersRef.current.set(fromUserID, pc);
        pendingOffersRef.current.delete(fromUserID);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("acceptCallRequest error", e);
        throw e;
      }
    },
    [ws]
  );

  // 通話リクエストの辞退（SDPを破棄するだけの簡易版）
  const declineCallRequest = useCallback((fromUserID: number) => {
    pendingOffersRef.current.delete(fromUserID);
  }, []);

  // 表示用に call offers の一覧を配列で提供
  const callOffers = Array.from(pendingOffersRef.current.keys());

  return {
    // 友達承認
    friendRequests,
    acceptFriendRequest,
    // 通話承諾
    callOffers,
    acceptCallRequest,
    declineCallRequest,
  };
}


