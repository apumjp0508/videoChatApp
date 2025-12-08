import { getWithAuth } from "../../utils/getwithAuth";
import { API_BASE } from "../../utils/apiBase";

export async function fetchConnectedUsers() {
  try {
    const data = await getWithAuth(`${API_BASE}/api/connected-users`);

    return data;
  } catch (error) {
    console.error("Error fetching connectedUsers:", error);
    return null;
  }
}
