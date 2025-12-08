package communication

// ConnectionClient は1クライアント接続のライフサイクルと送受信入口を抽象化する。
// フェーズ1では signaling.Client がこのインターフェースを実装する。
type ConnectionClient interface {
	// Start は read/write の処理ループを開始する（冪等）。
	Start()
	// Send は接続相手へメッセージを送る（非同期投入）。停止中はエラー。
	Send(msg interface{}) error
	// Stop は接続を安全に終了する（冪等）。
	Stop()
	// UserID はこの接続のユーザーIDを返す。
	UserID() uint
}