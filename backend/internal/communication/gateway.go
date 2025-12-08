package communication

// Gateway は、アプリケーション層から見た
// 「リアルタイム通信（WebSocket）の窓口」を表すポートです。
// 現時点では、既存の Hub 実装に合わせて定義します。
type Gateway interface {
	// 接続中のユーザーID一覧を取得する
	GetConnectedUsers() []uint

	// ユーザー→ユーザーの直接メッセージ配送
	// fromUserID から toUserID へ任意のペイロードを送る
	SendUserToUser(fromUserID, toUserID uint, payload interface{}) error

	// 任意のペイロードを指定ユーザーに送信する汎用メソッド
	// （既存 Hub.SendTo のシグネチャに合わせる）
	SendTo(userID uint, payload interface{}) error
}



