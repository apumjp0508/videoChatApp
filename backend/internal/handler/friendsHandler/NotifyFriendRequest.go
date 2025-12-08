package friendsHandler

import (
	wsclient "akichat/backend/internal/communication/websocket"
)

func (h *FriendRequestHandler) NotifyFriendRequest(userID uint,FriendID uint) error {
	payload := map[string]interface{}{
		"type":          "friend_request",
		"message":       "You received a friend request!",
		"requestUserID": userID,
	}
	return wsclient.GlobalHub.SendUserToUser(userID, FriendID, payload)
}