package main

import (
	"log"
	router "akichat/backend/internal/router"
	ws "akichat/backend/internal/communication/websocket"
	"akichat/backend/internal/config"
)



func main() {
	go ws.GlobalHub.Run()
	cfg := config.Load()
	r := router.SetupRouter()
	log.Println("http://0.0.0.0:" + cfg.Port + " で起動中です")
	if err := r.Run("0.0.0.0:" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
