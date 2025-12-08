"use client"
import { useUserStore } from "../../types/userStore";

export default function GetMe() {
  const { user } = useUserStore();
  const username = user.name;
  const email = user.email;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-6">プロフィール</h1>

      {username && email && (
        <div className="bg-white p-6 rounded shadow w-80">
          <p className="mb-2"><strong>ユーザー名:</strong> {username}</p>
          <p><strong>メールアドレス:</strong> {email}</p>
        </div>
      )}
    </div>
  );
}