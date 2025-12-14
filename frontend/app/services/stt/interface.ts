export type TranscribeHandlers = {
  onPartial?: (sequence: number, text: string) => void;
  onFinal?: (sequence: number, text: string) => void;
  onError?: (message: string) => void;
};

export type LocalModelMeta = {
  url: string;
  version: string;
};

export interface LocalTranscriber {
  init(meta: LocalModelMeta, handlers?: TranscribeHandlers): Promise<void>;
  start(): void;
  stop(): void;
  pushPcmFrame(frame: Int16Array, sampleRate: number): void;
}








