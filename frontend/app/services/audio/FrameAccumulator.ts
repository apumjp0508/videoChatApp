// Float32 版（VAD 前のエネルギー計算に使用するための蓄積）
export class FloatFrameAccumulator {
  private buf: Float32Array[] = [];
  private total = 0;

  constructor(private readonly minSamples: number) {}

  push(frame: Float32Array): Float32Array | null {
    this.buf.push(frame);
    this.total += frame.length;
    if (this.total < this.minSamples) return null;

    const out = new Float32Array(this.total);
    let offset = 0;
    for (const b of this.buf) {
      out.set(b, offset);
      offset += b.length;
    }
    this.buf = [];
    this.total = 0;
    return out;
  }

  reset(): void {
    this.buf = [];
    this.total = 0;
  }
}


