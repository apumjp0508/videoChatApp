// createAudioCapture.ts
export type CaptureOptions = {
  targetSampleRate?: number; // default 16000
  onFrame: (pcm: Int16Array, sampleRate: number) => void;
};

export type AudioCapture = {
  start: (stream: MediaStream, opts: CaptureOptions) => Promise<void>;
  stop: () => void;
};

// --- Utility functions ---

function downmixToMono(buffer: Float32Array[], frameSize: number): Float32Array {
  if (buffer.length === 0) return new Float32Array(0);
  if (buffer.length === 1) return buffer[0];
  const out = new Float32Array(frameSize);
  const ch = buffer.length;
  for (let i = 0; i < frameSize; i++) {
    let sum = 0;
    for (let c = 0; c < ch; c++) sum += buffer[c][i] || 0;
    out[i] = sum / ch;
  }
  return out;
}

function floatToInt16(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function downsample(input: Float32Array, inRate: number, outRate: number): Float32Array {
  if (outRate === inRate) return input;
  const ratio = inRate / outRate;
  const len = Math.floor(input.length / ratio);
  const out = new Float32Array(len);
  let pos = 0;
  for (let i = 0; i < len; i++) {
    out[i] = input[Math.floor(pos)];
    pos += ratio;
  }
  return out;
}

// --- Main capture implementation (AudioWorklet only) ---

export function createAudioCapture(): AudioCapture {
  let ctx: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let workletNode: AudioWorkletNode | null = null;

  async function start(stream: MediaStream, opts: CaptureOptions): Promise<void> {
    const targetRate = opts.targetSampleRate ?? 16000;

    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    source = ctx.createMediaStreamSource(stream);

    // AudioWorklet モジュールをロード
    await ctx.audioWorklet.addModule("/pcmWorklet.js");

    // WorkletNode を生成
    workletNode = new AudioWorkletNode(ctx, "pcm-worklet-processor");

    // PCM データを受信
    workletNode.port.onmessage = (ev) => {
      const msg = ev.data || {};
      if (msg?.type !== "audio") return;
      const left = new Float32Array(msg.left || []);
      const right = msg.right ? new Float32Array(msg.right) : null;
      const frameSize = left.length;
      const mono = downmixToMono(right ? [left, right] : [left], frameSize);
      const ds = downsample(mono, msg.sampleRate, targetRate);
      const i16 = floatToInt16(ds);
      opts.onFrame(i16, targetRate);
    };

    // 音声ストリームを Worklet に接続
    source.connect(workletNode);
    workletNode.connect(ctx.destination);
  }

  function stop(): void {
    try { workletNode?.disconnect(); } catch {}
    try { source?.disconnect(); } catch {}
    try { ctx?.close(); } catch {}
    workletNode = null;
    source = null;
    ctx = null;
  }

  return { start, stop };
}
