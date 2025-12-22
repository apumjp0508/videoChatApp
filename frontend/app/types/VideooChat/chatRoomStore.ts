"use client";

import { create } from "zustand";
import type { ChatRoomSession } from "./chatRoom";

type ChatRoomState = {
	session: ChatRoomSession;
	setId: (id: number | null) => void;
	setPeerConnection: (pc: RTCPeerConnection | null) => void;
	setLocalStream: (stream: MediaStream | null) => void;
	setRemoteStream: (stream: MediaStream | null) => void;
	setConnected: (connected: boolean) => void;
	reset: () => void;
};

const initialSession: ChatRoomSession = {
	id: null,
	peerConnection: null,
	localStream: null,
	remoteStream: null,
	isConnected: false,
};

export const useChatRoomStore = create<ChatRoomState>((set) => ({
	session: initialSession,
	setId: (id) => set((s) => ({ session: { ...s.session, id } })),
	setPeerConnection: (pc) => set((s) => ({ session: { ...s.session, peerConnection: pc } })),
	setLocalStream: (stream) => set((s) => ({ session: { ...s.session, localStream: stream } })),
	setRemoteStream: (stream) => set((s) => ({ session: { ...s.session, remoteStream: stream } })),
	setConnected: (isConnected) => set((s) => ({ session: { ...s.session, isConnected } })),
	reset: () => set({ session: initialSession }),
}));


