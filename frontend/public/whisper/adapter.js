// public/whisper/adapter.js
import ModuleFactory from "./libmain.js";

export async function createEngine() {
  const Module = await ModuleFactory({
    locateFile: (p) =>
      p.endsWith(".wasm") ? "/whisper/whisper.wasm" : `/whisper/${p}`,
  });

  // モデルを Emscripten FS にロード
  const res = await fetch("/whisper/models/ggml-tiny.en.bin");
  const buf = new Uint8Array(await res.arrayBuffer());
  Module.FS_createDataFile("/", "ggml-tiny.en.bin", buf, true, false);

  // whisper.cpp 側が期待する init を呼ぶ
  const ctx = Module.init("ggml-tiny.en.bin");

  return {
    async transcribe(pcmInt16, sampleRate) {
      // whisper.cpp は float32 を期待する
      const pcm = new Float32Array(pcmInt16.length);
      for (let i = 0; i < pcm.length; i++) {
        pcm[i] = pcmInt16[i] / 32768.0;
      }

      Module.full_default(ctx, pcm, "en", 4, false);

      // 実際は segment API で結果を取る（ここは次ステップ）
      return { final: "(transcribed)" };
    },
  };
}
