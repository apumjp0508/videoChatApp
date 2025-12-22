"use client";

import { create } from "zustand";
import type { TranscriptChunk } from "./transcript";

type TranscriptStateStore = {
  segments: TranscriptChunk[];
  currentText: string;
  lastSequence: number;
  setPartial: (chunk: TranscriptChunk) => void;
  addFinal: (chunk: TranscriptChunk) => void;
  clear: () => void;
};

export const useTranscriptStore = create<TranscriptStateStore>((set, get) => ({
  segments: [],
  currentText: "",
  lastSequence: -1,
  setPartial: (chunk) => {
    // シーケンス逆行は無視
    if (chunk.sequence <= get().lastSequence) return;
    // ログ出力（部分認識）
    // eslint-disable-next-line no-console
    console.log("[Transcript][partial]", chunk.text);
    set({
      currentText: chunk.text,
      lastSequence: chunk.sequence,
    });
  },
  addFinal: (chunk) => {
    // シーケンス逆行は無視
    if (chunk.sequence <= get().lastSequence) return;
    // ログ出力（確定）
    // eslint-disable-next-line no-console
    console.log("[Transcript][final]", chunk.text);
    set((s) => ({
      segments: [...s.segments, chunk],
      currentText: chunk.text, // 最終確定も一旦表示
      lastSequence: chunk.sequence,
    }));
  },
  clear: () => set({ segments: [], currentText: "", lastSequence: -1 }),
}));


