package signaling

import (
	comm "akichat/backend/internal/communication"
	"fmt"
)
type answerHandler struct{ rt comm.Gateway }

func NewAnswerHandler(rt comm.Gateway) MessageHandler { return &answerHandler{rt: rt} }

func (h *answerHandler) Handle(userID uint, payload map[string]interface{}) error {
	to := toUint(payload["to"])
	out := map[string]interface{}{
		"type": "webrtc_answer",
		"from": userID,
		"sdp":  payload["sdp"],
	}
	return h.rt.SendTo(to, out)
}


