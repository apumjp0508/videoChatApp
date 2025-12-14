import type { NotificationHandler, AppMessage } from "../interfaces";
import type { ModelLoader } from "../../model/interface";
import { modelLoader } from "../../model/loader";
import { localTranscriber } from "../../stt/service";

export class TranscriptHandler implements NotificationHandler {
  private readonly loader: ModelLoader = modelLoader;

  canHandle(msg: AppMessage): boolean {
    const t = String(msg?.type ?? "");
    return t === "model-info";
  }
  handle(_msg: AppMessage): void {
    const t = String((_msg as any)?.type ?? "");

    if (t === "model-info") {
      const data = _msg as any;
      const modelUrl = String(data?.url ?? "");
      const version = String(data?.version ?? "");

      // モデルをキャッシュしてロードする非同期関数を呼び出す
      this.loadModel(modelUrl, version).then(() => {
        // モデルロード完了後にローカルTranscriberを初期化
        localTranscriber.init({ url: modelUrl, version }).then(() => {
          // ここでは開始のみ。実際の音声入力は useLocalStt でpush
          localTranscriber.start();
        }).catch((e) => {
          // eslint-disable-next-line no-console
          console.error("LocalTranscriber init failed:", e);
        });
      });
      return;
    }
  }

  async loadModel(url: string, version: string) {
    try {
      await this.loader.load(url, version);
    } catch (e) {
      console.error("モデルの読み込みに失敗しました:", e);
    }
  }
}


