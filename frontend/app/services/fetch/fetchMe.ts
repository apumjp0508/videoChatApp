import { getWithAuth } from "../../utils/getwithAuth";
import { API_BASE } from "../../utils/apiBase";

export async function fetchMe() {
  try {
    const data = await getWithAuth(`${API_BASE}/api/getMe`);
    return data;
  } catch (error) {
    console.error("Error fetching me:", error);
    return null;
  }
}