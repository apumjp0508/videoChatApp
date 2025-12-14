/// <reference lib="webworker" />
// STT Worker (現在はスタブ動作)
// 受け取ったPCMをバッファし、一定サンプルで partial / final を返す
// 将来的に wasmSttEngine.transcribe(frame, sampleRate) に置き換える

// eslint-disable-next-line no-restricted-globals
const ctx: DedicatedWorkerGlobalScope = self as any;

let bufferedSamples = 0;
let hasEmittedPartialInWindow = false;

ctx.onmessage = async (e: MessageEvent) => {
  const msg = (e.data || {}) as {
    type: string;
    frame?: ArrayBuffer | Int16Array;
    sampleRate?: number;
    sequence?: number;
  };
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

  // wasmSttEngine による推論を実行（存在しない場合は安全に無視）
  const engine = (ctx as any).wasmSttEngine as
    | { transcribe: (f: Int16Array, sr: number) => Promise<{ partial?: string; final?: string }> | { partial?: string; final?: string } }
    | undefined;
  if (engine && typeof engine.transcribe === "function") {
    try {
      const result = await engine.transcribe(frame, sampleRate);
      if (result?.partial) {
        ctx.postMessage({ type: "partial", sequence, text: String(result.partial) });
      }
      if (result?.final) {
        ctx.postMessage({ type: "final", sequence, text: String(result.final) });
      }
    } catch (err) {
      // 推論失敗時はエラーを無視（必要なら error イベントを返す）
    }
    return;
  }

  // フォールバック（エンジン未提供時のみ、従来のスタブ動作）
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


