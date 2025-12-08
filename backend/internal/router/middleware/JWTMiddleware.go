package middleware

import (
    "fmt"
	"strings"
	"akichat/backend/internal/config"
	"github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

func JWTMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        var tokenStr string

        authHeader := c.GetHeader("Authorization")
       if authHeader != "" {
            tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
        }

        //トークンがまだ空なら認証エラー
        if tokenStr == "" {
            // WebSocketの場合はJSONを返さずAbortのみ（Upgrade前なので）
            if strings.Contains(c.Request.Header.Get("Upgrade"), "websocket") {
                fmt.Println("⚠️ WebSocket接続: tokenがありません")
                c.Abort()
                return
            }
            c.JSON(401, gin.H{"error": "トークンが見つかりません"})
            c.Abort()
            return
        }


        token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			//JWTライブラリは秘密鍵をこのバイト配列形式で受け取る必要がある
            return []byte(config.Load().JwtSecret), nil
        })

        if err != nil {
            c.JSON(401, gin.H{
                "error": "トークンの解析に失敗しました",
                "getToken": tokenStr,
                "secret": config.Load().JwtSecret,
                "details": err.Error(),})
            c.Abort()
            return
        }
        if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
            c.Set("email", claims["email"])
            // userID を float64 → uint に変換してセット
            if idFloat, ok := claims["userID"].(float64); ok {
                c.Set("userID", uint(idFloat))
            } else {
                c.JSON(401, gin.H{
                    "error": "userIDの型が不正です",
                    "value": claims["userID"],
                    "type": fmt.Sprintf("%T", claims["userID"]),
                })
                c.Abort()
                return
            }
            c.Next()
        } else {
            c.JSON(401, gin.H{"error": "トークンが無効または期限切れ"})
            c.Abort()
        }
    }
}
