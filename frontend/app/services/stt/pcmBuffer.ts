export interface PcmAggregator {
  readonly sampleRate: number;
  pushFrame(frame: Int16Array): void;
  /**
   * 最低長に達したら結合した PCM を返し、内部バッファをリセットする。
   * そうでなければ null を返す。
   */
  maybeBuildChunk(): Int16Array | null;
}

export class PcmBufferAggregator implements PcmAggregator {
  public readonly sampleRate: number;
  private readonly minSeconds: number;
  private readonly maxSeconds: number;
  private pcmBuffer: Int16Array[] = [];
  private totalSamples = 0;

  constructor(sampleRate = 16000, minSeconds = 1.0, maxSeconds = 2.0) {
    this.sampleRate = sampleRate;
    this.minSeconds = minSeconds;
    this.maxSeconds = maxSeconds;
  }

  pushFrame(frame: Int16Array): void {
    if (!(frame instanceof Int16Array)) return;
    this.pcmBuffer.push(frame);
    this.totalSamples += frame.length;
  }

  maybeBuildChunk(): Int16Array | null {
    const minSamples = Math.floor(this.sampleRate * this.minSeconds);
    if (this.totalSamples < minSamples) return null;

    // 結合
    const mergedAll = new Int16Array(this.totalSamples);
    let offset = 0;
    for (const f of this.pcmBuffer) {
      mergedAll.set(f, offset);
      offset += f.length;
    }

    // リセット（重要）
    this.pcmBuffer = [];
    const total = this.totalSamples;
    this.totalSamples = 0;

    // 上限を超える場合は末尾 MAX 秒分にクリップ
    const maxSamples = Math.floor(this.sampleRate * this.maxSeconds);
    if (total > maxSamples) {
      const start = total - maxSamples;
      return mergedAll.subarray(start);
    }
    return mergedAll;
  }
}


