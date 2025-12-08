package signaling

import comm "akichat/backend/internal/communication"

type iceHandler struct{ rt comm.Gateway }

func NewIceHandler(rt comm.Gateway) MessageHandler { return &iceHandler{rt: rt} }

func (h *iceHandler) Handle(userID uint, payload map[string]interface{}) error {
	to := toUint(payload["to"])
	out := map[string]interface{}{
		"type":      "webrtc_ice",
		"from":      userID,
		"candidate": payload["candidate"],
	}
	return h.rt.SendTo(to, out)
}


