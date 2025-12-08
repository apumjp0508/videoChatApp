package websocket

import (
	"errors"
	"sync"
	"time"

	gws "github.com/gorilla/websocket"
)

const (
	writeWait  = 10 * time.Second
	pingPeriod = 30 * time.Second
	readWait   = 60 * time.Second
)

// Client はWebSocket接続の ConnectionAdmin 実装
type Client struct {
	userID    uint
	conn      *gws.Conn
	send      chan interface{}
	stop      chan struct{}
	startOnce sync.Once
	stopOnce  sync.Once
	stopped   bool

	onMessage func(userID uint, raw []byte) error
}

func NewClient(userID uint, conn *gws.Conn, onMessage func(uint, []byte) error) *Client {
	// 受信サイズやバッファは必要に応じ調整
	return &Client{
		userID:    userID,
		conn:      conn,
		send:      make(chan interface{}, 64),
		stop:      make(chan struct{}),
		onMessage: onMessage,
	}
}

func (a *Client) UserID() uint { return a.userID }

func (a *Client) Start() {
	a.startOnce.Do(func() {
		go a.writePump()
		go a.readPump()
	})
}

func (a *Client) Send(msg interface{}) error {
	if a.stopped {
		return errors.New("connection stopped")
	}
	select {
	case a.send <- msg:
		return nil
	default:
		return errors.New("send buffer full")
	}
}

func (a *Client) Stop() {
	a.stopOnce.Do(func() {
		a.stopped = true
		close(a.stop)
		_ = a.conn.Close()
	})
}

func (a *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		a.conn.Close()
	}()
	for {
		select {
		case msg, ok := <-a.send:
			_ = a.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = a.conn.WriteMessage(gws.CloseMessage, []byte{})
				return
			}
			if err := a.conn.WriteJSON(msg); err != nil {
				return
			}
		case <-ticker.C:
			_ = a.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := a.conn.WriteMessage(gws.PingMessage, nil); err != nil {
				return
			}
		case <-a.stop:
			return
		}
	}
}

func (a *Client) readPump() {
	defer func() {
		// Hub 側で unregister するため、呼び出し元が Stop を呼ぶことを前提とする
	}()
	// ReadDeadline と PongHandler
	timeout := time.Duration(readWait)
	_ = a.conn.SetReadDeadline(time.Now().Add(timeout))
	a.conn.SetPongHandler(func(string) error {
		_ = a.conn.SetReadDeadline(time.Now().Add(timeout))
		return nil
	})
	for {
		_, msg, err := a.conn.ReadMessage()
		if err != nil {
			return
		}
		if a.onMessage != nil {
			_ = a.onMessage(a.userID, msg)
		}
	}
}



