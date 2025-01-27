package server

import (
	"forum/pkg/controllers"
	"forum/pkg/socket"
	"net/http"
)

var (
	Router *http.ServeMux
	Hub *socket.Hub
)

func StartRouter() {
	Router = http.NewServeMux()

	RegisterAPIs()

	// API subrouter
	Router.Handle("/api/", http.StripPrefix("/api", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		Router.ServeHTTP(w, r)
	})))

	// Web fileserver
	Router.Handle("/web-next/", http.StripPrefix("/web-next", http.FileServer(http.Dir("./web-next"))))
	// hnadle ws function
	Router.HandleFunc("/ws", controllers.WebSocketHandler)
    controllers.InitHub()
}
