"use client";

import { API_BASE } from "../../utils/apiBase";
import { postWithAuth } from "../../utils/postWithAuth";
import { useWebSocketStore } from "../../types/websocketStore";
import { useCallOfferStore } from "../../types/callOfferStore";
import { acceptCall } from "../videoChat/startChatOffer";

export async function acceptFriendRequest(requestUserID: number, userID: number) {
	await postWithAuth(`${API_BASE}/api/friend/request/approve`, {
		requestUserID: Number(requestUserID),
		userID: Number(userID),
	});
}

export async function acceptCallRequest(fromUserID: number) {
	const ws = useWebSocketStore.getState().ws;
	const offers = useCallOfferStore.getState().offers;
	const sdp = offers.get(fromUserID);
	if (!ws || ws.readyState !== WebSocket.OPEN || !sdp) return;
	await acceptCall(ws, fromUserID, sdp);
	useCallOfferStore.getState().remove(fromUserID);
}

export function declineCallRequest(fromUserID: number) {
	useCallOfferStore.getState().remove(fromUserID);
}