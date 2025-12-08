export type ChatRoomSession = {
	id: number | null;
	peerConnection: RTCPeerConnection | null;
	localStream: MediaStream | null;
	remoteStream: MediaStream | null;
	isConnected: boolean;
};



