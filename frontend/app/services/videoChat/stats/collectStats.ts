type Snapshot = {
	timestampMs: number;
	bytesSent: number;
	bytesReceived: number;
	packetsLost: number;
	packetsReceived: number;
	rttMs: number | null;
};

export type StatsResult = {
	bitrateKbps: number | null;
	packetLoss: number | null; // 0-1
	rttMs: number | null;
	snapshot: Snapshot;
};

export async function collectRtpStats(pc: RTCPeerConnection, prev?: Snapshot): Promise<StatsResult> {
	const report = await pc.getStats();
	let bytesSent = 0;
	let bytesReceived = 0;
	let packetsLost = 0;
	let packetsReceived = 0;
	let rttMs: number | null = null;

	report.forEach((s) => {
		// Outbound
		if (s.type === "outbound-rtp") {
			const anyS = s as any;
			bytesSent += Number(anyS.bytesSent ?? 0);
			// try rtt from remote-inbound if available (some browsers)
		}
		// Inbound
		if (s.type === "inbound-rtp") {
			const anyS = s as any;
			bytesReceived += Number(anyS.bytesReceived ?? 0);
			packetsReceived += Number(anyS.packetsReceived ?? 0);
			packetsLost += Number(anyS.packetsLost ?? 0);
		}
		// Candidate pair RTT
		if (s.type === "candidate-pair" && (s as any).selected) {
			const anyS = s as any;
			const rtt = Number(anyS.currentRoundTripTime ?? 0) * 1000;
			if (rtt > 0) rttMs = rtt;
		}
		// Remote inbound (Firefox/Chrome variants)
		if (s.type === "remote-inbound-rtp") {
			const anyS = s as any;
			const rtt = Number(anyS.roundTripTime ?? 0) * 1000;
			if (rtt > 0) rttMs = rtt;
		}
	});

	const now = Date.now();
	const snapshot: Snapshot = {
		timestampMs: now,
		bytesSent,
		bytesReceived,
		packetsLost,
		packetsReceived,
		rttMs,
	};

	if (!prev) {
		return {
			bitrateKbps: null,
			packetLoss: null,
			rttMs,
			snapshot,
		};
	}

	const dtSec = Math.max(0.001, (now - prev.timestampMs) / 1000);
	const dBytes = Math.max(0, (bytesSent + bytesReceived) - (prev.bytesSent + prev.bytesReceived));
	const bitrateKbps = (dBytes * 8) / 1000 / dtSec;

	const lostDelta = Math.max(0, packetsLost - prev.packetsLost);
	const recvDelta = Math.max(0, packetsReceived - prev.packetsReceived);
	const denom = lostDelta + recvDelta;
	const packetLoss = denom > 0 ? lostDelta / denom : 0;

	return {
		bitrateKbps,
		packetLoss,
		rttMs,
		snapshot,
	};
}


