package signaling

// MessageHandler は type 別ハンドラの共通インターフェース
type MessageHandler interface {
	Handle(userID uint, payload map[string]interface{}) error
}



