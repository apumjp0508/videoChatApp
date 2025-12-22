import { useNetworkStore } from "../../../types/network/networkStore";
import { collectRtpStats } from "./collectStats";
import { deriveQualityLevel } from "./quality";

const timers = new Map<number, { id: ReturnType<typeof setInterval>; prev?: ReturnType<typeof Object> }>();

export function monitorNetworkQuality(peerId: number, pc: RTCPeerConnection, intervalMs = 2000) {
	// stop existing if any
	stopMonitorNetworkQuality(peerId);
	let prev: any = undefined;
	const id = setInterval(async () => {
		try {
            //prevにて前回の結果を渡すことで、前回の結果と今回の結果を比較して、ネットワークの状態を推定する
			const res = await collectRtpStats(pc, prev);
			prev = res.snapshot;
			useNetworkStore.getState().updateMetrics(peerId, {
				bitrateKbps: Number.isFinite(res.bitrateKbps ?? NaN) ? res.bitrateKbps : null,
				packetLoss: Number.isFinite(res.packetLoss ?? NaN) ? res.packetLoss : null,
				rttMs: Number.isFinite(res.rttMs ?? NaN) ? res.rttMs : null,
				qualityLevel: deriveQualityLevel({
					bitrateKbps: res.bitrateKbps,
					packetLoss: res.packetLoss,
					rttMs: res.rttMs,
				}),
			});
		} catch {
			// ignore one-shot errors
		}
	}, intervalMs);
	timers.set(peerId, { id, prev });
}

export function stopMonitorNetworkQuality(peerId: number) {
	const t = timers.get(peerId);
	if (t) {
		clearInterval(t.id);
		timers.delete(peerId);
	}
}

export function stopAllMonitors() {
	for (const [, t] of timers) clearInterval(t.id);
	timers.clear();
}


