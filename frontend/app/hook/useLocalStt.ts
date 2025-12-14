"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createAudioCapture } from "../services/audio/capture";
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
    setError(null);
    if (!enabled || isRunning) return;
    try {
      const stream = session.localStream;
      if (!stream) {
        setError("localStream が利用できません。接続を確認してください。");
        return;
      }
      if (!captureRef.current) captureRef.current = createAudioCapture();
      await captureRef.current.start(stream, {
        targetSampleRate: sampleRate,
        onFrame: (pcm, rate) => {
          const now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
          if (now - lastEmitRef.current < debounceMs) return;
          lastEmitRef.current = now;
          localTranscriber.pushPcmFrame(pcm, rate);
        },
      });
      setIsRunning(true);
    } catch (e) {
      setError((e as Error)?.message ?? "unknown error");
    }
  }, [enabled, isRunning, session.localStream, sampleRate]);

  const stop = useCallback(() => {
    try {
      captureRef.current?.stop();
    } finally {
      setIsRunning(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      try {
        captureRef.current?.stop();
      } catch {
        // ignore
      }
    };
  }, []);

  return { start, stop, isRunning, error };
}


