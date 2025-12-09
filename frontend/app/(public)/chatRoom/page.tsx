"use client";

import { useEffect } from "react";
import { useVideoChatUI } from "../../component/useVideoChatUI";

export default function ChatRoom() {
  const { isConnected, VideoChatView } = useVideoChatUI();

  useEffect(() => {}, []);

  return (
    <main className="flex h-screen w-full bg-gray-100">
      {/* ビデオ通話欄 */}
      <div className="w-full bg-white p-4 flex flex-col items-center">
        <h2 className="text-lg font-bold mb-4">ビデオ通話</h2>
        {/* フックが管理するビデオビューをそのまま活用 */}
        {isConnected && VideoChatView}
        <button className="mt-6 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600">
          退出
        </button>
      </div>
    </main>
  );
}