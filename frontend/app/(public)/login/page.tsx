"use client";

import { useState } from "react";
import { useUserStore } from "../../types/userStore";
import { API_BASE } from "../../utils/apiBase";

export default function Login() {
    const [user, setUser] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch(`${API_BASE}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // クッキーを含める
                body: JSON.stringify({
                    username: user,
                    email: email,
                    password: password,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                alert("ログイン成功！");
                setUser("");
                setEmail("");
                setPassword("");

                useUserStore.getState().setUser({
                    id: data.userID,
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    token: data.accessToken,
                });

                // WebSocketはRootProviderのフックで自動接続されます
                                
            } else {
                console.log(data);
                alert(`ログイン失敗: ${data.error}`);
            }
        } catch (error) {
            console.error("Error during login:", error);
            alert("ログイン中にエラーが発生しました。");
        }
    };

    return(
        <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-6">ログイン</h1>

        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 w-80 bg-white p-6 rounded shadow"
        >
            <input
            type="text"
            placeholder="ユーザー名"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="border p-2 rounded"
            required
            />
            <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded"
            required
            />
            <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded"
            required
            />
            <button
            type="submit"
            className="bg-green-500 text-white py-2 rounded hover:bg-green-600 transition"
            >
            登録する
            </button>
        </form>
        <button
            onClick={() => window.history.back()}
            className="mt-4 text-blue-500 hover:underline"
        >
            戻る
        </button>
        </div>
    )

}