import type { LocalModelMeta, LocalTranscriber, TranscribeHandlers } from "./interface";
import { useTranscriptStore } from "../../types/transcriptStore";

class LocalTranscriberService implements LocalTranscriber {
  private model: LocalModelMeta | null = null;
  private seq = 0;
  private running = false;
  private handlers: TranscribeHandlers = {};
  private worker: Worker | null = null;

  async init(meta: LocalModelMeta, handlers?: TranscribeHandlers): Promise<void> {
    this.model = meta;
    if (handlers) this.handlers = handlers;
    this.seq = 0;
    // Worker を生成（既に存在する場合は再利用）
    if (!this.worker) {
      this.worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
      this.worker.onmessage = (e: MessageEvent) => {
        const msg = (e.data || {}) as { type: string; sequence: number; text: string };
        if (msg.type === "partial") {
          this.emitPartial(Number(msg.sequence || 0), String(msg.text || ""));
        } else if (msg.type === "final") {
          this.emitFinal(Number(msg.sequence || 0), String(msg.text || ""));
        }
      };
    }
  }

  start(): void {
    this.running = true;
  }

  stop(): void {
    this.running = false;
    // ワーカーは都度破棄（必要なら再initで再作成）
    try {
      this.worker?.terminate();
    } catch {}
    this.worker = null;
  }

  pushPcmFrame(frame: Int16Array, sampleRate: number): void {
    if (!this.running || !this.worker) return;
    const sequence = ++this.seq;
    // 転送コスト削減のため ArrayBuffer を移譲
    // NOTE: このframeは以後参照しないこと
    this.worker.postMessage(
      {
        type: "pcm",
        frame,
        sampleRate,
        sequence,
      },
      [frame.buffer]
    );
  }

  //emit=発火する
  private emitPartial(sequence: number, text: string) {
    useTranscriptStore.getState().setPartial({
      sequence,
      text,
      isFinal: false,
      startTimeMs: null,
      endTimeMs: null,
    });
    this.handlers.onPartial?.(sequence, text);
  }

  private emitFinal(sequence: number, text: string) {
    useTranscriptStore.getState().addFinal({
      sequence,
      text,
      isFinal: true,
      startTimeMs: null,
      endTimeMs: null,
    });
    this.handlers.onFinal?.(sequence, text);
  }
}

export const localTranscriber: LocalTranscriber = new LocalTranscriberService();


