"use client";

import { useEffect, useMemo, useRef } from "react";
import { useChatRoomStore } from "../types/chatRoomStore";

export function useVideoChatUI() {
  const session = useChatRoomStore((s) => s.session);
  const { localStream, remoteStream, isConnected } = session;

  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);

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

  const VideoChatView = useMemo(() => {
    if (!isConnected) return null;
    return (
      <div className="fixed inset-0 pointer-events-none">
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <video
          ref={localRef}
          autoPlay
          playsInline
          muted
          className="w-40 h-28 object-cover absolute bottom-4 right-4 rounded shadow-lg"
        />
      </div>
    );
  }, [isConnected]);

  return {
    isConnected,
    VideoChatView,
    localStream,
    remoteStream,
  };
}


