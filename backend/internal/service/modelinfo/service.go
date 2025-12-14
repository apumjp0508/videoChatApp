package modelinfo

import (
	"context"
	"errors"
	"time"

	comm "akichat/backend/internal/communication"
	"akichat/backend/internal/config"
)

type sender struct {
	rt         comm.Gateway
	cfg        *config.Config
	maxRetries int
	interval   time.Duration
}

func NewSender(rt comm.Gateway, cfg *config.Config) Sender {
	return &sender{
		rt:         rt,
		cfg:        cfg,
		maxRetries: 10,
		interval:   100 * time.Millisecond,
	}
}

func (s *sender) SendToUser(ctx context.Context, userID uint) error {
	if s.cfg == nil {
		return errors.New("config is nil")
	}
	payload := ModelInfo{
		Type:    "model-info",
		URL:     s.cfg.WhisperModelURL,
		Version: s.cfg.WhisperModelVersion,
	}
	var lastErr error
	for i := 0; i <= s.maxRetries; i++ {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		if err := s.rt.SendTo(userID, payload); err != nil {
			lastErr = err
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(s.interval):
			}
			continue
		}
		return nil
	}
	return lastErr
}


