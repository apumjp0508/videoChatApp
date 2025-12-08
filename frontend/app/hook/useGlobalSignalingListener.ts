"use client";

import { useSignalingNotification } from "./useSignalingNotification";
import { useWebSocketStore } from "../types/websocketStore";
import { useEffect } from "react";
import { handleRemoteAnswer, applyRemoteIce } from "../services/videoChat/callSession";
import { useNotificationStore } from "../types/notificationStore";
import { useCallOfferStore } from "../types/callOfferStore";

export function useGlobalSignalingListener() {
	const { ws } = useWebSocketStore();
	const addFriend = useNotificationStore((s) => s.add);
	const addOffer = useCallOfferStore((s) => s.add);

	// useSignalingNotificationが内部でwsのonmessageをbind/unbindする
	useSignalingNotification(ws, (data: any) => {
		if (data?.type === "friend_request") {
			const from = Number(data.requestUserID);
			addFriend(from, {
				message: String(data.message ?? ""),
				messageType: String(data.type ?? "info"),
			});
		}
	}, {
		onOffer: (_ws, { from, sdp }) => {
			addOffer(from, sdp);
		},
		onAnswer: (_ws, { from, sdp }) => {
			void handleRemoteAnswer(from, sdp);
		},
		onIce: (_ws, { from, candidate }) => {
			void applyRemoteIce(from, candidate);
		},
	});

	// ダミーのeffect（型・ライフサイクル固定用）
	useEffect(() => {}, []);
}



