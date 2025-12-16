"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createAudioCapture } from "../services/audio/capture";
import { defaultAudioWorkletModuleLoader } from "../services/audio/workletLoader";
import { localTranscriber } from "../services/stt/service";
import { useChatRoomStore } from "../types/chatRoomStore";

type UseLocalSttOptions = {
  enabled?: boolean; // デフォルト true
  sampleRate?: number; // 16k 推奨
  debounceMs?: number; // フレーム間引き（既定300ms）
};

type UseLocalSttReturn = {
  start: () => Promise<void>;
  stop: () => void;
  isRunning: boolean;
  error: string | null;
};

export function useLocalStt({
  enabled = true,
  sampleRate = 16000,
  debounceMs = 300,
}: UseLocalSttOptions = {}): UseLocalSttReturn {
  const { session } = useChatRoomStore();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const captureRef = useRef<ReturnType<typeof createAudioCapture> | null>(null);
  const lastEmitRef = useRef<number>(0);

  const start = useCallback(async () => {
    if (!enabled) return;
    if (isRunning) {
      console.warn("[useLocalStt] already running, skip start()");
      return;
    }

    setError(null);
    setIsRunning(true); // ✅ 先に立てることで多重起動防止

    try {

      const stream = session.localStream;
      if (!stream) {
        setError("localStream が利用できません。接続を確認してください。");
        console.warn("[useLocalStt] localStream not available.");
        setIsRunning(false);
        return;
      }
      if (!captureRef.current) {
        captureRef.current = createAudioCapture(defaultAudioWorkletModuleLoader); // Safariでも再利用される
      }

      await captureRef.current.start(stream, {
        targetSampleRate: sampleRate,
        //onframeは音声データの処理方法を定義する
        onFrame: (pcm, rate) => {
          const now =
            typeof performance !== "undefined" && performance.now
              ? performance.now()
              : Date.now();
          if (now - lastEmitRef.current < debounceMs) return;
          lastEmitRef.current = now;
          localTranscriber.pushPcmFrame(pcm, rate);
        },
      });

    } catch (e) {
      setError((e as Error)?.message ?? "unknown error");
      console.error("[useLocalStt] start error:", e);
      setIsRunning(false);
    }
  }, [enabled, isRunning, session.localStream, sampleRate, debounceMs]);

  const stop = useCallback(() => {
    try {
      captureRef.current?.stop();
    } catch (e) {
      console.warn("[useLocalStt] stop error:", e);
    } finally {
      setIsRunning(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      try {
        captureRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return { start, stop, isRunning, error };
}
