package controllers

import (
	"forum/pkg/socket"
	"net/http"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool {
        return true // You might want to add more strict origin checks in production
    },
}

var hub *socket.Hub

func InitHub() {
	hub = socket.NewHub()
    go hub.Run()
}

func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
    // check if websocket request has Upgrade header
    if r.URL.Path == "/ws" && r.Header.Get("Upgrade") != "websocket" {
        http.Redirect(w, r, "/", http.StatusSeeOther)
        return
    }
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    client := &socket.Client{
        Hub:  hub,
        Conn: conn,
        Send: make(chan []byte, 256),
    }

    client.Hub.Register <- client

    go client.WritePump()
    go client.ReadPump()
}
