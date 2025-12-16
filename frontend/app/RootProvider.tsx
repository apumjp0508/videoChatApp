"use client";

import { useWebSocketConnection } from "./hook/useWebsocketConnection";
import OnlineIndicator from "./component/OnlineIndicator";
import { useGlocalNotificationListener } from "./hook/useGlobalSignalingListener";
import { useStartSTT } from "./hook/useStartSTT";

export default function RootProvider({ children }: { children: React.ReactNode }) {
  // ✅ アプリ起動時に一度だけ WebSocket 接続を確立
  useWebSocketConnection();
  // ✅ ログイン状態で常時シグナリングを購読（UIを持たない）
  useGlocalNotificationListener();
  useStartSTT();

  return <>
    <OnlineIndicator />
    {children}
  </>;
}
