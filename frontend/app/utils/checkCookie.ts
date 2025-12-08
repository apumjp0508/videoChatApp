import { fetchWithAuth } from "./fetchWithAuth";
import { fetchMe } from "../services/fetch/fetchMe";
import { API_BASE } from "./apiBase";

export async function checkCookie(): Promise<{ loggedIn: boolean; message: string; id: number; email: string; name: string }> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/auth/verify`, {
      method: "GET",
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      const me = await fetchMe();
      const id = me?.id || 0;
      const email = me?.email || "";
      const name = me?.name || "";

      const isValid = id !== 0 && email !== "" && name !== "";

      console.log("checkCookie結果:", { isValid, data, me });

      return {
        loggedIn: isValid,
        message: isValid ? `ログイン中: ${data.email}` : "ユーザー情報が不完全です",
        id,
        email,
        name
      };
    }

    return { loggedIn: false, message: "認証確認に失敗しました", id: 0, email: "", name: "" };
  } catch (error) {
    console.error("checkCookieエラー:", error);
    return { loggedIn: false, message: "サーバー通信エラー", id: 0, email: "", name: ""  };
  }
}
