package middleware

import(
	"fmt"
	"net/http"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

func SessionMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		if session.Get("websocket_allowed") != true {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "session is not avilable"})
			fmt.Printf("セッションが無効")
			return
		}
		c.Next()
	}
}