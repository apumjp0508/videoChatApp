import { useEffect, useRef } from "react";
import { useUserStore } from "../types/userStore";
import { useWebSocketStore } from "../types/websocketStore";
import { WS_BASE } from "../utils/apiBase";
import { initWebSocketSession } from "../services/websocket/initWebSocketSession";

export function useWebSocketConnection() {
  const wsRef = useRef<WebSocket | null>(null);
  const { user, setUser } = useUserStore();
  const { setWS, clearWS } = useWebSocketStore();

  useEffect(() => {
    let isUnmounted = false;

    const cleanup = () => {
      const cur = wsRef.current;
      if (cur && (cur.readyState === WebSocket.OPEN || cur.readyState === WebSocket.CONNECTING)) {
        try { cur.close(); } catch {}
      }
      wsRef.current = null;
      clearWS();
      setUser({ isOnline: false });
    };

    // 未ログイン or トークンなしのときは接続しない
    if (!user?.id || !user?.token) {
      cleanup();
      return;
    }

    // まず init を叩いてセッションに許可をセット
    (async () => {
      try {
        const ok = await initWebSocketSession();
        if (!ok) {
          console.warn("⚠️ websocket init 失敗");
          cleanup();
          return;
        }

        if (isUnmounted) return;

        const ws = new WebSocket(`${WS_BASE}/api/session/websocket`);
        wsRef.current = ws;
        setWS(ws);

        ws.onopen = () => {
          console.log("✅ WebSocket接続完了");
          setUser({ isOnline: true });
        };

        ws.onclose = () => {
          console.warn("⚠️ WebSocket切断");
          setUser({ isOnline: false });
          clearWS();
        };

        ws.onerror = (error: Event) => {
          console.error("❌ WebSocketエラー", error);
          setUser({ isOnline: false });
        };
      } catch (e) {
        console.error("❌ WebSocket初期化エラー", e);
        cleanup();
      }
    })();

    return () => {
      isUnmounted = true;
      cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.token]);

  return wsRef;
}

// no-op helper removed (moved into init util)