export type UseSpeechWorkerOptions = {
	// どちらか一方を指定。ws が優先される
	ws?: WebSocket | null;
	wsUrl?: string | null; // 例: wss://example.com/api/speech
	// MediaRecorder の mimeType（ブラウザ対応により無視される場合あり）
	mimeType?: string;
	// チャンク生成間隔（ms）
	timesliceMs?: number;
	// WebSocket をこのフックで作成した場合に、自動クローズするか
	autoCloseWs?: boolean;
};

export type UseSpeechWorkerReturn = {
	start: () => Promise<void>;
	stop: () => Promise<void>;
	isRecording: boolean;
	error: string | null;
};


