export type EngineLoadOptions = {
  type: "module";
  url: string;
  version?: string;
  config?: unknown;
  timeoutMs?: number; // default 10000
};

type WorkerState = {
  loaded: boolean;
  version?: string;
  inFlight?: Promise<void>;
};

const workerState = new WeakMap<Worker, WorkerState>();

//URLを正規化する処理
function resolveUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = (window as any).__NEXT_DATA__?.assetPrefix ?? "";
  return `${base}${url}`;
}

export async function loadSttEngine(worker: Worker, opts: EngineLoadOptions): Promise<void> {
  const state = workerState.get(worker) ?? { loaded: false };
  workerState.set(worker, state);

  const timeoutMs = opts.timeoutMs ?? 10000;
  if (state.loaded && (!opts.version || state.version === opts.version)) {
    return;
  }
  if (state.inFlight) {
    return state.inFlight;
  }

  const p = new Promise<void>(async (resolve, reject) => {
    let timer: number | undefined;
    const onMessage = (ev: MessageEvent) => {
      const msg = ev.data || {};
      if (msg?.type === "engine-ready") {
        if (typeof timer !== "undefined") clearTimeout(timer);
        worker.removeEventListener("message", onMessage);
        state.loaded = true;
        state.version = msg?.version ?? opts.version;
        resolve();
      } else if (msg?.type === "engine-error") {
        if (typeof timer !== "undefined") clearTimeout(timer);
        worker.removeEventListener("message", onMessage);
        reject(new Error(String(msg?.error ?? "engine load error")));
      }
    };   
    worker.addEventListener("message", onMessage);
    timer = window.setTimeout(() => {
      worker.removeEventListener("message", onMessage);
      reject(new Error("engine load timeout"));
    }, timeoutMs);

    try {
      const resolvedUrl = resolveUrl(opts.url);
      worker.postMessage({
        type: "load-engine-url",
        url: resolvedUrl,
        version: opts.version,
        config: opts.config,
      });
    } catch (e) {
      if (typeof timer !== "undefined") clearTimeout(timer);
      worker.removeEventListener("message", onMessage);
      reject(e as Error);
    }
  });

  state.inFlight = p.finally(() => {
    state.inFlight = undefined;
  });
  return state.inFlight;
}


