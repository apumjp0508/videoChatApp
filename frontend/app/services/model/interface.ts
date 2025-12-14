export interface ModelLoader {
  load(url: string, version: string): Promise<void>;
}




