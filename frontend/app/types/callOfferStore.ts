"use client";

import { create } from "zustand";

type CallOfferState = {
	offers: Map<number, RTCSessionDescriptionInit>;
	add: (fromUserID: number, sdp: RTCSessionDescriptionInit) => void;
	remove: (fromUserID: number) => void;
	reset: () => void;
};

export const useCallOfferStore = create<CallOfferState>((set, get) => ({
	offers: new Map(),
	add: (fromUserID, sdp) =>
		set(() => {
			const next = new Map(get().offers);
			next.set(fromUserID, sdp);
			return { offers: next };
		}),
	remove: (fromUserID) =>
		set(() => {
			const next = new Map(get().offers);
			next.delete(fromUserID);
			return { offers: next };
		}),
	reset: () => set({ offers: new Map() }),
}));



