"use client";

import { useAuthCheck } from "./hook/useAuthCheck";
import Notification from "./component/home/approveNotification";
import AuthDashboard from "./component/AuthDashboard/page";
import GuestDashboard from "./component/GuestDashboard/page";

export default function HomePage() {
  const { isChecking, isLogin, userID, userName, userEmail } = useAuthCheck();

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-800 text-2xl">
        認証確認中...
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-r from-blue-500 to-pink-400 text-white text-4xl font-bold">
      {isLogin ? (
        <>
          <Notification userID={userID} />
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-6">
              こんにちは {userID ?? "ゲスト"} さん！
            </h1>
            <h2>
              ユーザー名: {userName}<br />
              メール: {userEmail ?? ""}
            </h2>
            <AuthDashboard />
          </div>
        </>
      ) : (
        <GuestDashboard />
      )}
    </main>
  );
}
