/// <reference lib="webworker" />
// STT Worker (現在はスタブ動作)
// 受け取ったPCMをバッファし、一定サンプルで partial / final を返す
// 将来的に wasmSttEngine.transcribe(frame, sampleRate) に置き換える

import type { ISttEngine } from "./interface";

// eslint-disable-next-line no-restricted-globals
const ctx: DedicatedWorkerGlobalScope = self as any;

let bufferedSamples = 0;
let hasEmittedPartialInWindow = false;
let engineRef: ISttEngine | undefined;

ctx.onmessage = async (e: MessageEvent) => {
  const msg = (e.data || {}) as
    | { type: "pcm"; frame: ArrayBuffer | Int16Array; sampleRate: number; sequence: number }
    | { type: "load-engine-url"; url: string; version?: string; config?: unknown }

    if (msg.type === "load-engine-url") {
      try {
        const mod: any = await import(/* webpackIgnore: true */ msg.url);
        const factory = mod?.createEngine ?? mod?.default ?? mod;
        const engine = (typeof factory === "function"
          ? await factory(msg.config)
          : factory) as ISttEngine | undefined;
  
        if (!engine || typeof engine.transcribe !== "function") {
          throw new Error("invalid engine module: transcribe not found");
        }
  
        engineRef = engine;
        ctx.postMessage({ type: "engine-ready", version: msg.version });
      } catch (err) {
        ctx.postMessage({ type: "engine-error", error: String(err) });
      }
      return;
    }

  if (msg.type !== "pcm") return;

  const sampleRate = Number(msg.sampleRate || 16000);
  const sequence = Number(msg.sequence || 0);
  let frame: Int16Array;
  if (msg.frame instanceof Int16Array) {
    frame = msg.frame;
  } else if (msg.frame instanceof ArrayBuffer) {
    frame = new Int16Array(msg.frame);
  } else {
    return;
  }

  // STT エンジンによる推論を実行（存在しない場合は安全にフォールバック）
  const engine = engineRef;
  if (engine && typeof engine.transcribe === "function") {
    try {
      const result = await engine.transcribe(frame, sampleRate);
      // eslint-disable-next-line no-console
      console.log("[stt worker] engine result:", result);
      if (result?.partial) {
        ctx.postMessage({ type: "partial", sequence, text: String(result.partial) });
      }
      if (result?.final) {
        ctx.postMessage({ type: "final", sequence, text: String(result.final) });
      }
    } catch (err) {
      console.error("[stt worker] engine error:", err);
    }
    return;
  }

  // フォールバック（エンジン未提供時のみ、従来のスタブ動作）
  // eslint-disable-next-line no-console
  console.log("[stt worker] engine not available. using fallback stub.");
  bufferedSamples += frame.length;
  const halfSec = Math.floor(sampleRate * 0.5);
  const twoSec = Math.floor(sampleRate * 2);
  if (!hasEmittedPartialInWindow && bufferedSamples >= halfSec && bufferedSamples < twoSec) {
    ctx.postMessage({ type: "partial", sequence, text: "（ローカルSTT: 解析中…）" });
    hasEmittedPartialInWindow = true;
  } else if (bufferedSamples >= twoSec) {
    ctx.postMessage({ type: "final", sequence, text: "（ローカルSTT: 解析完了のスタブ）" });
    bufferedSamples = 0;
    hasEmittedPartialInWindow = false;
  }
};


