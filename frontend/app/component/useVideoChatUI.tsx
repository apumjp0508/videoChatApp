"use client";

import { useEffect, useMemo, useRef } from "react";
import { useChatRoomStore } from "../types/chatRoomStore";
import { useDynamicVideoQuality } from "../hook/useDynamicVideoQuality";
import { useTranscriptStore } from "../types/transcriptStore";
import { useLocalStt } from "../hook/useLocalStt";

export function useVideoChatUI() {
  const session = useChatRoomStore((s) => s.session);
  const { localStream, remoteStream, isConnected } = session;
  const transcript = useTranscriptStore((s) => s.currentText);
  const segments = useTranscriptStore((s) => s.segments);

  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const { start: sttStart, stop: sttStop, isRunning: sttRunning } = useLocalStt({
    enabled: true,
    sampleRate: 16000,
  });

  useEffect(() => {
    if (localRef.current && localStream) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (localRef.current as any).srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteStream) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (remoteRef.current as any).srcObject = remoteStream;
    }
  }, [remoteStream]);

  // 動的クオリティ制御（peerIdが未設定の場合は無効値で呼び、内部で無視される）
  useDynamicVideoQuality({
    peerId: Number(session.id ?? -1),
    pc: session.peerConnection,
  });

  // 接続状態とローカルストリームに応じてローカルSTTの開始/停止を制御
  useEffect(() => {
    if (isConnected && localStream && !sttRunning) {
      sttStart().catch(() => {});
    }
    if (!isConnected && sttRunning) {
      try {
        sttStop();
      } catch {}
    }
    return () => {
      try {
        sttStop();
      } catch {}
    };
  }, [isConnected, localStream, sttRunning, sttStart, sttStop]);

  const VideoChatView = useMemo(() => {
    if (!isConnected) return null;
    return (
      <div className="fixed inset-0">
        <div className="w-full h-full flex">
          {/* Left: Transcript panel (1/3 width) */}
          <aside className="hidden md:flex md:w-1/3 h-full flex-col bg-black/40 backdrop-blur-sm">
            <div className="px-4 py-3 border-b border-white/10">
              <span className="text-white/90 font-medium text-sm">Transcript</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {segments.map((seg) => (
                <div
                  key={`seg-${seg.sequence}`}
                  className={`max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    seg.isFinal
                      ? "bg-white/90 text-gray-900"
                      : "bg-white/70 text-gray-900"
                  }`}
                >
                  {seg.text}
                </div>
              ))}
              {transcript && (
                <div className="max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed bg-white/60 text-gray-900">
                  {transcript}
                </div>
              )}
            </div>
          </aside>

          {/* Mobile Transcript overlay (bottom) */}
          <div className="md:hidden absolute inset-x-0 bottom-0 z-10 max-h-[45%] bg-black/70 backdrop-blur-sm text-white">
            <div className="px-4 py-2 border-b border-white/10 text-xs font-medium text-white/90">
              Transcript
            </div>
            <div className="p-3 overflow-y-auto space-y-2">
              {segments.map((seg) => (
                <div
                  key={`mseg-${seg.sequence}`}
                  className={`max-w-[95%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    seg.isFinal ? "bg-white/90 text-gray-900" : "bg-white/70 text-gray-900"
                  }`}
                >
                  {seg.text}
                </div>
              ))}
              {transcript && (
                <div className="max-w-[95%] rounded-lg px-3 py-2 text-sm leading-relaxed bg-white/60 text-gray-900">
                  {transcript}
                </div>
              )}
            </div>
          </div>

          {/* Right: Video area (2/3 width) */}
          <main className="flex-1 relative bg-black">
            <video
              ref={remoteRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
            />
            <video
              ref={localRef}
              autoPlay
              playsInline
              muted
              className="w-40 h-28 object-cover absolute bottom-4 right-4 rounded shadow-lg transform scale-x-[-1] border border-white/20"
            />
          </main>
        </div>
      </div>
    );
  }, [isConnected, segments, transcript]);

  return {
    isConnected,
    VideoChatView,
    localStream,
    remoteStream,
  };
}


