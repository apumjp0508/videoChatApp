"use client";

import { useEffect } from "react";
import { useState } from "react";
import { fetchFriends } from "../../services/fetch/fetchFriends";
import { fetchConnectedUsers } from "../../services/fetch/fetchConnectedUsers";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../types/userStore";
import Notification from "../../component/home/approveNotification";
import { startOutgoingCall, subscribeConnectionState } from "../../services/videoChat/callSession";
import { ConnState } from "../../types/VideooChat/callSession";
import { useWebSocketStore } from "../../types/network/websocketStore";

export default function ChatStartButton() {
    type Friend = { ID: number; username: string; isOnline?: boolean };
    const [ friends, setFriends ] = useState<Array<Friend>>([]);
    const [ connectedUsers, setConnectedUsers ] = useState<number[]>([]);
    const { user } = useUserStore();
    const { ws } = useWebSocketStore();
    const router = useRouter();
    useEffect(() => {
        // 接続状態の監視: connected になったらチャット画面へ遷移
        const unsubscribe = subscribeConnectionState((state) => {
            if (state === ConnState.Connected) {
                router.push("/chatRoom");
            }
        });
        const updateFriendsOnlineStatus = (connected: number[]) => {
            const onlineSet = new Set(connected);
            //prevで書くと非同期で常に最新の値が入れられるので強豪が存在しないというメリットがある
            setFriends(prev => prev.map(f => ({
                ...f,
                isOnline: onlineSet.has(f.ID),
            })));
        };

        const fetchData = async () => {
            const friends = await fetchFriends();
            setFriends(friends);
            updateFriendsOnlineStatus(connectedUsers);
        }; 
        
        const loadConnectedUsers = async () => {
            const data = await fetchConnectedUsers();
            setConnectedUsers(data?.connected_users ?? []);
            updateFriendsOnlineStatus(data?.connected_users ?? []);
        };
        fetchData();
        loadConnectedUsers();
        const interval = setInterval(loadConnectedUsers, 5000);
        return () => {
            clearInterval(interval);
            unsubscribe();
        };
    }, [router]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-r from-blue-500 to-pink-400 text-white text-4xl font-bold">
            <Notification userID={user?.id ?? 0} />
            <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-md p-6">
                <h1 className="text-2xl font-bold text-center text-pink-600 mb-6">🎉 友達リスト</h1>

                {!friends || friends.length === 0 ? (
                    <p className="text-center text-gray-500">友達はまだいません。</p>
                ) : (
                    <ul className="space-y-4">
                    {friends.map((friend) => (
                        <li
                        key={friend.ID}
                        className="flex items-center justify-between bg-pink-100 rounded-xl px-4 py-3 shadow-sm hover:bg-pink-200 transition"
                        >
						<div className="flex items-center gap-2">
							<span
								className={`inline-block h-3 w-3 rounded-full ${friend.isOnline ? "bg-green-400 animate-pulse shadow-[0_0_10px_#22c55e]" : "bg-gray-300"}`}
								aria-label={friend.isOnline ? "オンライン" : "オフライン"}
								title={friend.isOnline ? "オンライン" : "オフライン"}
							/>
							<span className="text-pink-800 font-medium">{friend.username}</span>
						</div>
						<button
							disabled={!friend.isOnline}
							className={`${friend.isOnline ? "bg-pink-500 hover:bg-pink-600 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"} text-sm font-bold py-1 px-3 rounded-full shadow transition`}
                            onClick={async () => {
                                if (!user?.id || !friend.isOnline) return;
                                if (!ws || ws.readyState !== WebSocket.OPEN) {
                                    alert("WebSocketが未接続です。少し待ってから再試行してください。");
                                    return;
                                }
                                await startOutgoingCall(ws, friend.ID);
                                router.push("/loading");
                            }}
                        >
                            会議を始める    
                        </button>
                        </li>
                    ))}
                    </ul>
                )}

            </div>
        </main>
    );
}