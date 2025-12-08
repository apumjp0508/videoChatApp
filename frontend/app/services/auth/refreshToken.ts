import { useUserStore } from "../../types/userStore";
import { API_BASE } from "../../utils/apiBase";

let refreshPromise: Promise<boolean> | null = null;

export async function refreshTokenIfNeeded(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const r = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      const data = await r.json();
      refreshPromise = null;

      if (r.ok && data.accessToken) {
        useUserStore.getState().setUser({ token: data.accessToken });
        console.log("✅ Token refreshed:", data.accessToken);
        return true;
      }

      console.warn("⚠️ Token refresh failed:", data);
      return false;
    } catch (err) {
      console.error("Token refresh error:", err);
      refreshPromise = null;
      return false;
    }
  })();

  return refreshPromise;
}
