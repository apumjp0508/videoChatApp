// pcmWorklet.js
class PCMWorkletProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const left = input[0];
    const right = input[1] || null;

    // PCM データをメインスレッドへ送信
    this.port.postMessage({
      type: "audio",
      left: left.slice(0),
      right: right ? right.slice(0) : null,
      sampleRate: sampleRate,
    });

    // true を返すと処理継続
    return true;
  }
}

registerProcessor("pcm-worklet-processor", PCMWorkletProcessor);
