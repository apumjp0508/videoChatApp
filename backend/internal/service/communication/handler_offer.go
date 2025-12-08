package signaling

import (
	"fmt"
	comm "akichat/backend/internal/communication"
)
type offerHandler struct{ rt comm.Gateway }

func NewOfferHandler(rt comm.Gateway) MessageHandler { return &offerHandler{rt: rt} }

func (h *offerHandler) Handle(userID uint, payload map[string]interface{}) error {
	to := toUint(payload["to"])
	out := map[string]interface{}{
		"type": "webrtc_offer",
		"from": userID,
		"sdp":  payload["sdp"],
	}
	fmt.Println("send offer:", out);

	return h.rt.SendTo(to, out)
}



