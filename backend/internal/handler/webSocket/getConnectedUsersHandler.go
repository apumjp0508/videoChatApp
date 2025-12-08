package websocket

import(
	"net/http"
	"github.com/gin-gonic/gin"
	ws "akichat/backend/internal/communication/websocket"
)

func GetConnectedUsersHandler(c *gin.Context) {
	userIDs := ws.GlobalHub.GetConnectedUsers()
	c.JSON(http.StatusOK, gin.H{
		"connected_users": userIDs,
	})
}
