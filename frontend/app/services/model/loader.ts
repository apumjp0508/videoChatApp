import type { ModelLoader } from "./interface";

const CACHE_NAME = "model-cache";

async function checkModelCache(url: string, version: string): Promise<boolean> {
  try {
    if (typeof window === "undefined" || !("caches" in window)) return false;
    const cache = await caches.open(CACHE_NAME);
    const req = new Request(`${url}?v=${encodeURIComponent(version)}`, { method: "GET" });
    const hit = await cache.match(req, { ignoreSearch: false });
    return !!hit;
  } catch {
    return false;
  }
}

async function downloadAndCacheModel(url: string, version: string): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) {
    // フォールバック: 単にフェッチして破棄（メモリロードで使うのでOK）
    const resp = await fetch(url, { method: "GET" });
    if (!resp.ok) throw new Error(`Failed to download model: ${resp.status}`);
    return;
  }
  const cache = await caches.open(CACHE_NAME);
  const req = new Request(`${url}?v=${encodeURIComponent(version)}`, { method: "GET" });
  const resp = await fetch(url, { method: "GET" });
  if (!resp.ok) throw new Error(`Failed to download model: ${resp.status}`);
  await cache.put(req, resp.clone());
}

async function loadModelToMemory(url: string, version?: string): Promise<void> {
  let resp: Response | undefined;
  if (typeof window !== "undefined" && "caches" in window) {
    const cache = await caches.open(CACHE_NAME);
    const req = new Request(`${url}?v=${encodeURIComponent(version ?? "")}`, { method: "GET" });
    resp = await cache.match(req, { ignoreSearch: false }) || undefined;
  }
  if (!resp) {
    resp = await fetch(url, { method: "GET" });
    if (!resp.ok) throw new Error(`Failed to fetch model for memory load: ${resp.status}`);
  }
  // 実際のMLフレームワーク読み込み箇所（例: WebNN/TF.js/WASM等）に差し替え
  // ここではウォームアップとしてArrayBuffer化のみ行う
  await resp.arrayBuffer();
}

class ModelLoaderService implements ModelLoader {
  async load(url: string, version: string): Promise<void> {
    const alreadyCached = await checkModelCache(url, version);
    if (!alreadyCached) {
      // eslint-disable-next-line no-console
      console.log("モデルをダウンロード中...", url);
      await downloadAndCacheModel(url, version);
    } else {
      // eslint-disable-next-line no-console
      console.log("キャッシュ済みのモデルを使用します");
    }
    await loadModelToMemory(url, version);
    // eslint-disable-next-line no-console
    console.log("モデルのロード完了");
  }
}

export const modelLoader: ModelLoader = new ModelLoaderService();
export { checkModelCache, downloadAndCacheModel, loadModelToMemory };


