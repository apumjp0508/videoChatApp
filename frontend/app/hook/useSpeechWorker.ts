"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChatRoomStore } from "../types/VideooChat/chatRoomStore";
import type { UseSpeechWorkerOptions, UseSpeechWorkerReturn } from "../types/speechWorker";

export function useSpeechWorker({
  ws = null,
  wsUrl = null,
  mimeType = "audio/webm;codecs=opus",
  timesliceMs = 500,
  autoCloseWs = true,
}: UseSpeechWorkerOptions = {}): UseSpeechWorkerReturn {
  const { session } = useChatRoomStore();
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const createdWsRef = useRef<boolean>(false);

  // 後片付け
  const cleanup = useCallback(() => {
    try {
      const rec = mediaRecorderRef.current;
      if (rec && rec.state !== "inactive") {
        rec.stop();
      }
      mediaRecorderRef.current = null;
    } catch {
      // ignore
    }
    try {
      if (autoCloseWs && createdWsRef.current && wsRef.current) {
        wsRef.current.close();
      }
    } catch {
      // ignore
    }
    wsRef.current = null;
    createdWsRef.current = false;
    setIsRecording(false);
  }, [autoCloseWs]);

  // 録音開始
  const start = useCallback(async () => {
    setError(null);
    if (isRecording) return;
    try {
      // localStream の検証
      const stream = session.localStream;
      if (!stream) {
        setError("localStream が利用できません。接続を確認してください。");
        return;
      }
      const hasAudio = stream.getAudioTracks().some((t) => t.enabled && !t.muted);
      if (!hasAudio) {
        // audio トラックが無効でも MediaRecorder 自体は動作し得るが、明示的に警告
        // 録音は続行する（必要ならここで return）
      }

      // WebSocket の用意
      if (ws) {
        wsRef.current = ws;
        createdWsRef.current = false;
      } else {
        if (!wsUrl) {
          setError("ws または wsUrl を指定してください。");
          return;
        }
        const sock = new WebSocket(wsUrl);
        wsRef.current = sock;
        createdWsRef.current = true;
        // 接続完了まで待つ
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("WebSocket接続タイムアウト")), 8000);
          sock.onopen = () => {
            clearTimeout(timeout);
            resolve();
          };
          sock.onerror = () => {
            clearTimeout(timeout);
            reject(new Error("WebSocket接続エラー"));
          };
        });
      }

      // MediaRecorder の生成
      let recorder: MediaRecorder;
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mimeType)) {
        recorder = new MediaRecorder(stream, { mimeType });
      } else {
        recorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = recorder;

      // chunk を受信して WS 送信
      recorder.ondataavailable = async (ev: BlobEvent) => {
        try {
          const sock = wsRef.current;
          if (!sock || sock.readyState !== WebSocket.OPEN) return;
          const buf = await ev.data.arrayBuffer();
          sock.send(buf);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn("音声チャンク送信に失敗しました:", e);
        }
      };

      recorder.onerror = (ev) => {
        setError(`MediaRecorder error: ${String((ev as any).error ?? ev)}`);
      };

      // 録音開始（timeslice 指定で自動的に ondataavailable が定期発火）
      recorder.start(timesliceMs);
      setIsRecording(true);
    } catch (e) {
      setError((e as Error)?.message ?? "unknown error");
      cleanup();
    }
  }, [session.localStream, ws, wsUrl, mimeType, timesliceMs, isRecording, cleanup]);

  // 停止
  const stop = useCallback(async () => {
    cleanup();
  }, [cleanup]);

  // アンマウント時に自動停止
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { start, stop, isRecording, error };
}


