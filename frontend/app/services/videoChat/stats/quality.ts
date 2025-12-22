import type { QualityLevel } from "../../../types/network/network";

export function deriveQualityLevel(params: {
	bitrateKbps: number | null | undefined;
	packetLoss: number | null | undefined;
	rttMs: number | null | undefined;
}): QualityLevel {
	const bitrate = params.bitrateKbps ?? 0;
	const loss = params.packetLoss ?? 0;
	const rtt = params.rttMs ?? 0;
	if (bitrate > 1500 && loss < 0.02 && rtt < 100) return "high";
	if (bitrate > 800 && loss < 0.05 && rtt < 200) return "medium";
	if (bitrate > 300 && loss < 0.1 && rtt < 400) return "low";
	return "poor";
}


