import { API_BASE } from "../../utils/apiBase";
import { fetchWithAuth } from "../../utils/fetchWithAuth";

export async function initWebSocketSession(): Promise<boolean> {
  const res = await fetchWithAuth(`${API_BASE}/api/websocket/init`, {
    method: "POST",
    credentials: "include",
  });
  return res.ok;
}




