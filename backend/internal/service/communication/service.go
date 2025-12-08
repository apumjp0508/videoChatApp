package signaling

import (
	"encoding/json"
	"fmt"
	comm "akichat/backend/internal/communication"
)

// InboundSignal はクライアント→サーバのシグナリングメッセージ形式（既存実装に合わせる）
type InboundSignal struct {
	Type      string          `json:"type"`
	To        uint            `json:"to"`
	SDP       json.RawMessage `json:"sdp,omitempty"`
	Candidate json.RawMessage `json:"candidate,omitempty"`
}

// DeliveryError は宛先への配送に失敗した場合のエラー（元のtypeや宛先を保持）
type DeliveryError struct {
	OriginalType string
	To           uint
	Err          error
}

func (e *DeliveryError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("delivery failed: type=%s to=%d: %v", e.OriginalType, e.To, e.Err)
	}
	return fmt.Sprintf("delivery failed: type=%s to=%d", e.OriginalType, e.To)
}

type Service struct {
	RT       comm.Gateway
	handlers map[string]MessageHandler
}

// RegisterHandler は type 文字列に対応するハンドラを登録する
func (s *Service) RegisterHandler(msgType string, h MessageHandler) {
	if s.handlers == nil {
		s.handlers = make(map[string]MessageHandler)
	}
	s.handlers[msgType] = h
}

// ensureDefaults は webrtc_* 用の既定ハンドラを遅延登録する
func (s *Service) ensureDefaults() {
	if s.handlers != nil {
		return
	}
	s.handlers = map[string]MessageHandler{
		"webrtc_offer":  NewOfferHandler(s.RT),
		"webrtc_answer": NewAnswerHandler(s.RT),
		"webrtc_ice":    NewIceHandler(s.RT),
	}
}

// Handle は受信した生JSONを解釈し、適切な宛先に中継する
// 既存の payload 形式に合わせて map を構築する
func (s *Service) Handle(senderID uint, raw []byte) error {
	// JSON を汎用 map に解釈
	var payload map[string]interface{}
	if err := json.Unmarshal(raw, &payload); err != nil {
		return nil
	}
	t, _ := payload["type"].(string)
	if t == "" {
		return nil
	}
	s.ensureDefaults()
	if h, ok := s.handlers[t]; ok {
		return h.Handle(senderID, payload)
	}
	// 未知タイプは無視
	return nil
}

// ユーティリティ: JSON number 等を uint へ丸める
func toUint(v interface{}) uint {
	switch n := v.(type) {
	case uint:
		return n
	case int:
		if n < 0 {
			return 0
		}
		return uint(n)
	case int64:
		if n < 0 {
			return 0
		}
		return uint(n)
	case float64:
		if n < 0 {
			return 0
		}
		return uint(n)
	default:
		return 0
	}
}
