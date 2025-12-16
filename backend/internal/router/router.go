package router

import (
    "fmt"
    wsHandler "akichat/backend/internal/handler/webSocket"
    UserHandler "akichat/backend/internal/handler/userHandler"
    middleware "akichat/backend/internal/router/middleware"
    friendsHandler "akichat/backend/internal/handler/friendsHandler"
    jwtTokenHandler "akichat/backend/internal/handler/auth/token/JWTToken"
    sessionHandler "akichat/backend/internal/handler/auth/session"
    "akichat/backend/internal/config"
    "akichat/backend/internal/app"
    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
)	

func SetupRouter() *gin.Engine {
	r := gin.Default()

    // DIコンテナ初期化
    container, err := app.NewContainer()
    if err != nil {
        fmt.Printf("container 初期化失敗: %v", err)
        return r
    }
    // Hubのランループを起動（未起動だと register/unregister が詰まる）
    go container.Hub.Run()

    cfg := config.Load()

    store := cookie.NewStore([]byte(cfg.SessionSecretKey))
    store.Options(sessions.Options{
        Path:     cfg.SessionPath,
        HttpOnly: cfg.SessionHttpOnly,
        Secure:   cfg.SessionSecure,
        SameSite: cfg.SessionSameSite,
        MaxAge:   cfg.SessionMaxAge,
    })

    r.Use(sessions.Sessions("mysession", store))
	
    r.Use(cors.New(cors.Config{
        AllowOrigins:     cfg.CorsOrigins,
        AllowMethods:     cfg.CorsMethods,
        AllowHeaders:     cfg.CorsHeaders,
        ExposeHeaders:    cfg.CorsExpose,
        AllowCredentials: cfg.CorsCredentials,
    }))

    // Handlers
    registerHandler := UserHandler.NewRegisterHandler(container.AuthService)
    loginHandler := UserHandler.NewLoginHandler(container.AuthService)
    getMeHandler := UserHandler.NewGetMeHandler(container.UserRepo)

    FetchFriendsHandler := friendsHandler.NewFriendShipHandler(container.FriendsService)
    searchNotFriendHandler := friendsHandler.NewSearchNotFriendHandler(container.UserRepo)
    friendRequestHandler := friendsHandler.NewFriendRequestHandler(container.FriendsService)

    r.POST("/api/register", registerHandler.RegisterHandler)
    r.POST("/api/login", loginHandler.LoginHandler)
    r.POST("/api/auth/refresh", jwtTokenHandler.RefreshHandler)

    auth:= r.Group("/api")
    auth.Use(middleware.JWTMiddleware())
    {
        auth.GET("/auth/verify", func(c *gin.Context) {
            fmt.Println("認証チェック中")
            c.JSON(200, gin.H{"message": "認証チェックOK"})
        })
        auth.POST("/websocket/init", sessionHandler.SetupSessionHandler)
        auth.GET("/connected-users", wsHandler.GetConnectedUsersHandler)
        auth.GET("/getMe", getMeHandler.GetMeHandler)
        auth.GET("/fetch/friends" ,FetchFriendsHandler.GetFriendsHandler)
        auth.POST("/search/notfriends", searchNotFriendHandler.SearchNotFriendHandler)
        auth.POST("/friend/request", friendRequestHandler.FriendRequestHandler)
        auth.POST("/friend/request/approve", FetchFriendsHandler.ApproveRequestHandler)
    }

    wsGroup := r.Group("/api/session")
    wsGroup.Use(middleware.SessionMiddleware())
    // DI版のWebSocketHandlerを使用
	wsH := wsHandler.NewWSHandler(container.Hub, container.SignalingService)
    wsGroup.GET("/websocket", wsH.Handle)

	fmt.Println("websocket通信を開始")

	return r
}	

