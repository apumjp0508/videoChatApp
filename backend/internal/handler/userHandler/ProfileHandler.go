package UserHandler

import (
	"fmt"
	"net/http"
	"akichat/backend/internal/repository"
	"github.com/gin-gonic/gin"
)

type GetMeHandler struct {
	//Repoという変数にはuserrepository型のポインタを格納するという定義
	Repo *repository.UserRepository
}

func NewGetMeHandler(repo *repository.UserRepository) *GetMeHandler {
	return &GetMeHandler{Repo: repo}
}

//メソッドレシーバーは関数に引数として渡すこともできる
func (h *GetMeHandler) GetMeHandler(c *gin.Context) {
	// 認証されたユーザーの情報を取得
	userID, exists := c.Get("userID")
	fmt.Println("GetMeHandler: userID from context =", userID)
	if !exists {
		fmt.Println("userID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// ユーザー情報をデータベースから取得
	//h.Repoはuserrepository型のポインタ
	user, err := h.Repo.GetUserByUserID(userID.(uint))
	if err != nil {
		fmt.Println("Error retrieving user:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve user getMe"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":    user.ID,
		"email": user.Email,
		"name":  user.Username,
	})
}