export function attachEndpointHandlers(
  ws: WebSocket,
  onMessage: (data: any) => void
) {
  const listener = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      // すべてのメッセージをそのままコールバックへ委譲（集中的にルーティングする）
      onMessage(data);
    } catch {
      // ignore parse errors
    }
  };
  ws.addEventListener("message", listener);
  return () => ws.removeEventListener("message", listener);
}


