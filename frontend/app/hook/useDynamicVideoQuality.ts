"use client";

import { useEffect, useRef } from "react";
import { useNetworkStore } from "../types/networkStore";

type Props = {
  peerId: number;
  pc: RTCPeerConnection | null;
};

function mapQualityToEncoding(quality: "high" | "medium" | "low" | "poor") {
  switch (quality) {
    case "high":
      return { maxBitrate: 1_500_000, scaleResolutionDownBy: 1 };
    case "medium":
      return { maxBitrate: 800_000, scaleResolutionDownBy: 1.5 };
    case "low":
      return { maxBitrate: 400_000, scaleResolutionDownBy: 2 };
    case "poor":
    default:
      return { maxBitrate: 200_000, scaleResolutionDownBy: 3 };
  }
}

export function useDynamicVideoQuality({ peerId, pc }: Props) {
  const qualityLevel = useNetworkStore((s) => s.byPeerId.get(peerId)?.qualityLevel ?? null);
  const lastAppliedLevelRef = useRef<string | null>(null);

  useEffect(() => {
    // 無効な引数は無視
    if (!pc || !qualityLevel || !peerId || peerId <= 0) return;
    // 同一レベル連続時はスキップ
    if (lastAppliedLevelRef.current === qualityLevel) return;

    try {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (!sender) return;

      const base = sender.getParameters() as RTCRtpSendParameters;
      const baseEnc: RTCRtpEncodingParameters =
        Array.isArray(base?.encodings) && base.encodings.length > 0
          ? (base.encodings[0] as RTCRtpEncodingParameters)
          : ({} as RTCRtpEncodingParameters);
      const { maxBitrate, scaleResolutionDownBy } = mapQualityToEncoding(qualityLevel);
      // 既存値と同一ならスキップ（不要なsetParametersを避ける）
      if (
        baseEnc &&
        baseEnc.maxBitrate === maxBitrate &&
        baseEnc.scaleResolutionDownBy === scaleResolutionDownBy
      ) {
        lastAppliedLevelRef.current = qualityLevel;
        return;
      }

      const newEnc: RTCRtpEncodingParameters = {
        ...baseEnc,
        maxBitrate,
        scaleResolutionDownBy,
      };
      const newParams: RTCRtpSendParameters = {
        ...(base as RTCRtpSendParameters),
        encodings: [newEnc],
      };
      // 任意: ネットワーク悪化時の挙動を優先（対応ブラウザのみ）
      // (params as any).degradationPreference = "balanced";
      sender.setParameters(newParams).then(
        () => {
          lastAppliedLevelRef.current = qualityLevel;
        },
        (e) => {
          // eslint-disable-next-line no-console
          console.warn("setParameters failed", e);
        }
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("dynamic quality adjust error", e);
    }
  }, [qualityLevel, pc]);
}


