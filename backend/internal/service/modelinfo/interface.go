package modelinfo

import "context"

type Sender interface {
	SendToUser(ctx context.Context, userID uint) error
}


