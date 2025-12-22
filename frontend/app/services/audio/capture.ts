// createAudioCapture.ts
export type CaptureOptions = {
  targetSampleRate?: number; // default 16000
  onFrame: (pcm: Int16Array, sampleRate: number) => void;
};

export type AudioCapture = {
  start: (stream: MediaStream, opts: CaptureOptions) => Promise<void>;
  stop: () => void;
};

import { downmixToMono, floatToInt16, downsample } from "../../utils/audio/signal";
import { AudioWorkletModuleLoader, defaultAudioWorkletModuleLoader } from "./workletLoader";
import { FloatFrameAccumulator } from "./FrameAccumulator";
import { HangoverVad } from "./hangover";

// --- Main capture implementation (AudioWorklet only) ---

let sharedCtx: AudioContext | null = null;

export function createAudioCapture(
  loader: AudioWorkletModuleLoader = defaultAudioWorkletModuleLoader
): AudioCapture {
  let source: MediaStreamAudioSourceNode | null = null;
  let workletNode: AudioWorkletNode | null = null;
  let running = false;
  let vadAccumulator: FloatFrameAccumulator | null = null;
  let hangoverVad: HangoverVad | null = null;

  async function start(stream: MediaStream, opts: CaptureOptions): Promise<void> {
    if (running) {
      // eslint-disable-nexady running");
      return;
    }
    running = true;
    const targetRate = opts.targetSampleRate ?? 16000;
    vadAccumulator = new FloatFrameAccumulator(160); // 10ms @ 16kHz
    hangoverVad = new HangoverVad(0.01, 160, 10);

    if (!sharedCtx || sharedCtx.state === "closed") {
      sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = sharedCtx;

    // Feature detect
    if (!("audioWorklet" in ctx)) {
      // eslint-disable-next-line no-console
      console.error("[capture] audioWorklet not supported in this context.");
      running = false;
      throw new Error("AudioWorklet not supported");
    }

    // Safari: ensure resumed after user gesture
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[capture] Failed to resume AudioContext:", e);
      }
    }

    const assetPrefix = (window as any).__NEXT_DATA__?.assetPrefix ?? "";
    const workletUrl = `${assetPrefix}/pcmWorklet.js`;

    // AudioWorklet モジュールをロード（DIローダへ委譲）
    try {
      await loader.load(ctx, workletUrl);
      console.log("[capture] AudioWorklet module ensured ✅");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[capture] Failed to ensure AudioWorklet module:", e);
      running = false;
      throw e;
    }

    // WorkletNode を生成
    workletNode = new AudioWorkletNode(ctx, "pcm-worklet-processor");

    source = ctx.createMediaStreamSource(stream);

    // PCM データを受信
    workletNode.port.onmessage = (ev) => {
      const msg = ev.data || {};
      if (msg?.type !== "audio") return;
      const left = new Float32Array(msg.left || []);
      const right = msg.right ? new Float32Array(msg.right) : null;
      const frameSize = left.length;
      const mono = downmixToMono(right ? [left, right] : [left], frameSize);
      const ds = downsample(mono, msg.sampleRate, targetRate);
      // フロートPCMをまず蓄積してから VAD（Hangover 付き）にかける
      const merged = vadAccumulator?.push(ds) ?? null;
      if (!merged){
        console.log("[capture] no merged");
        return;
      }
      const active = hangoverVad?.process(merged) ?? false;
      if (!active){
        console.log("[capture] no active");
        return;
      }
      console.log("[capture] active");
      // 発話中のみ STT に流す（Int16 へ変換）
      const i16 = floatToInt16(merged);
      opts.onFrame(i16, targetRate);
    };

    // 音声ストリームを Worklet に接続
    source.connect(workletNode);
    workletNode.connect(ctx.destination);
  }

  function stop(): void {
    try {
      if (workletNode) {
        try { workletNode.port.onmessage = null as unknown as (this: MessagePort, ev: MessageEvent) => any; } catch {}
        workletNode.disconnect();
      }
    } catch {}
    try { source?.disconnect(); } catch {}
    workletNode = null;
    source = null;
    running = false;
    try { vadAccumulator?.reset(); } catch {}
    try { hangoverVad?.reset(); } catch {}
    vadAccumulator = null;
    hangoverVad = null;
    // sharedCtx は再利用のため閉じない
    // eslint-disable-next-line no-console
    console.log("[capture] stopped");
  }

  return { start, stop };
}
