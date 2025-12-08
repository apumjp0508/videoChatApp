"use client";

import { useUserStore } from "../types/userStore";

export default function OnlineIndicator() {
	const { user } = useUserStore();
	const isOnline = Boolean(user?.isOnline);
	return (
		<div className="fixed top-4 right-4 z-50">
			<div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow">
				<span
					className={`inline-block h-3 w-3 rounded-full ${isOnline ? "bg-green-400 animate-pulse shadow-[0_0_10px_#22c55e]" : "bg-gray-300"}`}
					aria-label={isOnline ? "オンライン" : "オフライン"}
					title={isOnline ? "オンライン" : "オフライン"}
				/>
				<span className="text-sm font-semibold text-gray-700">
					{isOnline ? "オンライン" : "オフライン"}
				</span>
			</div>
		</div>
	);
}




