export function downmixToMono(buffer: Float32Array[], frameSize: number): Float32Array {
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

export function floatToInt16(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

export function downsample(input: Float32Array, inRate: number, outRate: number): Float32Array {
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


