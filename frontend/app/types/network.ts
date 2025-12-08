export type QualityLevel = "high" | "medium" | "low" | "poor";

export type NetworkState = {
	peerId: number | null;
	peerConnection: RTCPeerConnection | null;
	localStream: MediaStream | null;
	remoteStream: MediaStream | null;
	bitrateKbps: number | null;
	packetLoss: number | null; // 0-1 の割合（UIで%表示可）
	rttMs: number | null;
	qualityLevel: QualityLevel;
};


