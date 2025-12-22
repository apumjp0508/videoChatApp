"use client";

import { create } from "zustand";
import type { NetworkState, QualityLevel } from "./network/network";

type NetworkStoreState = {
	byPeerId: Map<number, NetworkState>;
	ensure: (peerId: number) => void;
	remove: (peerId: number) => void;
	reset: () => void;
	setPeerConnection: (peerId: number, pc: RTCPeerConnection | null) => void;
	setStreams: (peerId: number, local: MediaStream | null, remote: MediaStream | null) => void;
	updateMetrics: (peerId: number, metrics: Partial<Pick<NetworkState, "bitrateKbps" | "packetLoss" | "rttMs" | "qualityLevel">>) => void;
};

const defaultState = (peerId: number): NetworkState => ({
	peerId,
	peerConnection: null,
	localStream: null,
	remoteStream: null,
	bitrateKbps: null,
	packetLoss: null,
	rttMs: null,
	qualityLevel: "poor",
});

export const useNetworkStore = create<NetworkStoreState>((set, get) => ({
	byPeerId: new Map(),

	ensure: (peerId) => {
		const cur = get().byPeerId;
		if (!cur.has(peerId)) {
			const next = new Map(cur);
			next.set(peerId, defaultState(peerId));
			set({ byPeerId: next });
		}
	},

	remove: (peerId) => {
		const cur = get().byPeerId;
		if (cur.has(peerId)) {
			const next = new Map(cur);
			next.delete(peerId);
			set({ byPeerId: next });
		}
	},

	reset: () => set({ byPeerId: new Map() }),

	setPeerConnection: (peerId, pc) => {
		const cur = get().byPeerId;
		const st = cur.get(peerId) ?? defaultState(peerId);
		const next = new Map(cur);
		next.set(peerId, { ...st, peerConnection: pc });
		set({ byPeerId: next });
	},

	setStreams: (peerId, local, remote) => {
		const cur = get().byPeerId;
		const st = cur.get(peerId) ?? defaultState(peerId);
		const next = new Map(cur);
		next.set(peerId, { ...st, localStream: local, remoteStream: remote ?? st.remoteStream });
		set({ byPeerId: next });
	},

	updateMetrics: (peerId, metrics) => {
		const cur = get().byPeerId;
		const st = cur.get(peerId) ?? defaultState(peerId);
		const next = new Map(cur);
		next.set(peerId, { ...st, ...metrics });
		set({ byPeerId: next });
	},
}));


