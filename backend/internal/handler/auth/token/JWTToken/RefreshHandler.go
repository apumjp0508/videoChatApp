package JWTHandler;

import (

    "fmt"
	"time"
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

func RefreshHandler(c *gin.Context) {

    refreshToken, err := c.Cookie("refreshToken")
    if err != nil {
        fmt.Println("refresh token not provided")
        c.JSON(http.StatusUnauthorized, gin.H{"error": "refresh token not provided"})
        return
    }

    // トークンをパース
    token, err := jwt.ParseWithClaims(refreshToken, &RefreshClaims{}, func(t *jwt.Token) (interface{}, error) {
        return jwtSecret, nil
    })
    if err != nil || !token.Valid {
        fmt.Println("invalid refresh token")
        c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
        return
    }

    rc := token.Claims.(*RefreshClaims)
    // 追加チェック：ユーザー存在、リフレッシュトークンが有効か（DBチェックなど）

    // 新しいトークンペアを発行
    newAccess, newRefresh, err := GenerateTokens(rc.UserID, "") 
    if err != nil {
        fmt.Println("could not generate tokens")
        c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate tokens"})
        return
    }

    // 新しい refreshToken を Cookie にセットし直す（トークンローテーション）
    c.SetCookie("refreshToken", newRefresh, int(7*24*time.Hour.Seconds()), "/", "localhost", false, true)

    c.JSON(http.StatusOK, gin.H{
        "accessToken": newAccess,
    })
}