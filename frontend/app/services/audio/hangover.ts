export class HangoverVad {
  private inSpeech = false;
  private silenceFrames = 0;

  constructor(
    private readonly threshold = 0.01,
    private readonly minLength = 160,
    private readonly hangoverFrames = 10
  ) {}

  process(pcm: Float32Array): boolean {
    if (pcm.length < this.minLength) {
      return this.inSpeech;
    }

    let sum = 0;
    for (let i = 0; i < pcm.length; i++) {
      sum += Math.abs(pcm[i]);
    }
    const avg = sum / pcm.length;

    if (avg > this.threshold) {
      this.inSpeech = true;
      this.silenceFrames = 0;
      console.log("[hangoverVad] inSpeech", true);
      return true;
    }

    if (this.inSpeech) {
      this.silenceFrames++;
      if (this.silenceFrames <= this.hangoverFrames) {
        console.log("[hangoverVad] inSpeech", true);
        return true;
      }
      this.inSpeech = false;
      this.silenceFrames = 0;
      console.log("[hangoverVad] inSpeech", false);
    }

    return false;
  }

  reset(): void {
    this.inSpeech = false;
    this.silenceFrames = 0;
  }
}


