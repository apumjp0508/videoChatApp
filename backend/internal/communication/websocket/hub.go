package websocket

import (
	"fmt"
	"sync"
	comm "akichat/backend/internal/communication"
)

type Hub struct {
	mu         sync.RWMutex
	clients    map[uint]comm.ConnectionClient
	register   chan comm.ConnectionClient
	unregister chan comm.ConnectionClient
}

var GlobalHub = NewHub()

var _ comm.Gateway = (*Hub)(nil)

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[uint]comm.ConnectionClient),
		register:   make(chan comm.ConnectionClient),
		unregister: make(chan comm.ConnectionClient),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case conn := <-h.register:
			h.handleRegister(conn)
		case conn := <-h.unregister:
			h.handleUnregister(conn)
		}
	}
}

func (h *Hub) handleRegister(c comm.ConnectionClient) {
	id := c.UserID()

	if old, exists := h.clients[id]; exists && old != c {
		old.Stop() // 古い接続を終了（再接続）
	}
	h.clients[id] = c

	go c.Start() // goroutineで通信ループ起動
}

func (h *Hub) handleUnregister(c comm.ConnectionClient) {
	id := c.UserID()

	if cur, ok := h.clients[id]; ok && cur == c {
		cur.Stop()
		delete(h.clients, id)
	}
}

// Register は新しい接続を登録する
func (h *Hub) Register(c comm.ConnectionClient) {
	h.register <- c
}

// Unregister は接続を解除する
func (h *Hub) Unregister(c comm.ConnectionClient) {
	h.unregister <- c
}

func (h *Hub) GetConnectedUsers() []uint {
	h.mu.RLock()
	defer h.mu.RUnlock()

	ids := make([]uint, 0, len(h.clients))
	for id := range h.clients {
		ids = append(ids, id)
	}
	return ids
}

func (h *Hub) SendTo(userID uint, payload interface{}) error {
	h.mu.RLock()
	conn, ok := h.clients[userID]
	h.mu.RUnlock()

	if !ok {
		return fmt.Errorf("user %d is not connected", userID)
	}
	return conn.Send(payload)
}

func (h *Hub) SendUserToUser(fromUserID, toUserID uint, payload interface{}) error {
	// 将来的にfromUserIDを使って制御したい場合のため保持
	return h.SendTo(toUserID, payload)
}
