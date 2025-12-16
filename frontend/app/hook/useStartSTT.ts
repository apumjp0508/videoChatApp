"use client";

import { useEffect } from "react";
import { localTranscriber } from "../services/stt/service";

export function useStartSTT() {
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        console.log("[STT] Initializing local transcriber...");
        await localTranscriber.init({
          url: "/whisper/adapter.js", // 重みなしのSTTエンジン
          version: "1.0.0",
        });
        if (isMounted) {
          localTranscriber.start();
          console.log("[STT] Engine started ✅");
        }
      } catch (err) {
        console.error("[STT] Engine initialization failed:", err);
      }
    })();

    // クリーンアップ処理（アプリ終了時 or ページアンマウント時）
    return () => {
      isMounted = false;
      localTranscriber.stop();
      console.log("[STT] Engine stopped 🛑");
    };
  }, []);
}
