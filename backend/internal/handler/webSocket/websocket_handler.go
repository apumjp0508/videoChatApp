package websocket

import (
	"context"
	"fmt"
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/gin-contrib/sessions"
	signaling "akichat/backend/internal/service/communication"
	"akichat/backend/internal/service/modelinfo"
	wsclient "akichat/backend/internal/communication/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// DIフレンドリーな構造体ハンドラ
type WSHandler struct {
	Hub       *wsclient.Hub
	Signaling *signaling.Service
	ModelInfo modelinfo.Sender
}

func NewWSHandler(hub *wsclient.Hub, sig *signaling.Service, mi modelinfo.Sender) *WSHandler {
	return &WSHandler{
		Hub:       hub,
		Signaling: sig,
		ModelInfo: mi,
	}
}

// Handle はセッションから user_id を取得し、WS 接続を開始する
func (h *WSHandler) Handle(c *gin.Context) {
    fmt.Println("websocket通信を開始")
    session := sessions.Default(c)
    var userID uint
    switch v := session.Get("user_id").(type) {
    case int:
        userID = uint(v)
    case int64:
        userID = uint(v)
    case float64:
        userID = uint(v)
    case uint:
        userID = v
    default:
        fmt.Println("Invalid user_id type:", v)
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
        return
    }

    conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
    if err != nil {
        fmt.Println("failed to upgrade connection:", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upgrade connection"})
        return
    }
    sigSvc := &signaling.Service{ RT: h.Hub }
    client := wsclient.NewClient(userID, conn, sigSvc.Handle)
    // 登録
    h.Hub.Register(client)
    // モデル情報を非同期で送信（Gateway経由、登録競合に備えてリトライはサービス側で実施）
    go func(uid uint) {
        _ = h.ModelInfo.SendToUser(context.Background(), uid)
    }(userID)
    // 開始
    client.Start()
}
