"use client";

import { useAdminStore } from "../../types/adminStore";

export default function AdminPage() {
  const videoChat = useAdminStore((s) => s.permissions.videoChat);
  const transcribe = useAdminStore((s) => s.permissions.transcribe);
  const setPermission = useAdminStore((s) => s.setPermission);

  return (
    <main className="min-h-screen w-full bg-gray-50 text-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Admin Settings</h1>

        <section className="space-y-4">
          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
            <div>
              <div className="font-medium">Video Chat</div>
              <div className="text-sm text-gray-500">アプリ内のビデオ通話を許可する</div>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={videoChat}
                onChange={(e) => setPermission("videoChat", e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-colors relative">
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${videoChat ? "translate-x-5" : ""}`} />
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
            <div>
              <div className="font-medium">Transcribe (STT)</div>
              <div className="text-sm text-gray-500">ローカル音声認識（文字起こし）を許可する</div>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={transcribe}
                onChange={(e) => setPermission("transcribe", e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-colors relative">
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${transcribe ? "translate-x-5" : ""}`} />
              </div>
            </label>
          </div>
        </section>
      </div>
    </main>
  );
}


