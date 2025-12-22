// ストリーミング文字起こしで扱うデータ型定義
// - TranscriptChunk: 部分/確定の1チャンク
// - TranscriptStreamMessage: サーバからのイベントメッセージ
// - TranscriptState: クライアント側で蓄積する状態

export type TranscriptChunk = {
	sequence: number; // 到着順序を担保するための連番
	text: string; // 認識テキスト
	isFinal: boolean; // true=確定、false=部分
	startTimeMs?: number | null;
	endTimeMs?: number | null;
	confidence?: number | null; // 0..1（提供される場合）
	language?: string | null; // "ja", "en" など（提供される場合）
};

export type TranscriptStreamMessage =
	| { type: "partial"; data: TranscriptChunk }
	| { type: "final"; data: TranscriptChunk }
	| { type: "error"; error: string };

export type TranscriptState = {
	segments: TranscriptChunk[]; // 受信順に格納（必要に応じて isFinal でマージ）
	lastUpdatedAt: number; // Date.now()
};

export type TranscriptHandlers = {
	onPartial?: (chunk: TranscriptChunk) => void;
	onFinal?: (chunk: TranscriptChunk) => void;
	onError?: (message: string) => void;
};


