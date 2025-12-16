export interface AudioWorkletModuleLoader {
  load(ctx: AudioContext, workletUrl: string): Promise<void>;
}

class DefaultAudioWorkletModuleLoader implements AudioWorkletModuleLoader {
  private readonly loadedByCtx = new WeakMap<AudioContext, boolean>();
  private readonly loadingByCtx = new WeakMap<AudioContext, Promise<void>>();

  async load(ctx: AudioContext, workletUrl: string): Promise<void> {
    if (!("audioWorklet" in ctx)) {
      throw new Error("AudioWorklet not supported");
    }
    if (this.loadedByCtx.get(ctx)) return;
    let p = this.loadingByCtx.get(ctx);
    if (!p) {
      p = ctx.audioWorklet.addModule(workletUrl);
      this.loadingByCtx.set(ctx, p);
    }
    try {
      await p;
      this.loadedByCtx.set(ctx, true);
      // eslint-disable-next-line no-console
      console.log("[workletLoader] loaded:", workletUrl);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[workletLoader] failed to load:", e);
      throw e;
    } finally {
      this.loadingByCtx.delete(ctx);
    }
  }
}

export const defaultAudioWorkletModuleLoader: AudioWorkletModuleLoader =
  new DefaultAudioWorkletModuleLoader();


