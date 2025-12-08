"use client";

import { create } from "zustand";
import type { NotificationItem } from "./notification";

type NotificationState = {
	friendRequests: Record<number, NotificationItem>;
	add: (fromUserID: number, item: NotificationItem) => void;
	clear: (fromUserID: number) => void;
	reset: () => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
	friendRequests: {},
	add: (fromUserID, item) =>
		set((s) => ({ friendRequests: { ...s.friendRequests, [fromUserID]: item } })),
	clear: (fromUserID) =>
		set((s) => {
			const next = { ...s.friendRequests };
			delete next[fromUserID];
			return { friendRequests: next };
		}),
	reset: () => set({ friendRequests: {} }),
}));



