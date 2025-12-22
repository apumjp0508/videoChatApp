"use client";

import { useWebSocketStore } from "../types/network/websocketStore";
import { useEffect } from "react";
import { notificationContainer } from "../services/notifications/container";
import { attachEndpointHandlers } from "../services/signaling/endpoint";

export function useGlocalNotificationListener() {
	const { ws } = useWebSocketStore();

	const onMessage = (data: any) => {
		notificationContainer.router.route(data);
	};
	useEffect(() => {
		if (!ws || ws.readyState !== WebSocket.OPEN) return;
		let detach: (() => void) | null = null;
		detach = attachEndpointHandlers(ws, onMessage);
		return () => {
			detach?.();
		};
	}, [ws, onMessage]);

	// ダミーのeffect（型・ライフサイクル固定用）
	useEffect(() => {}, []);
}



