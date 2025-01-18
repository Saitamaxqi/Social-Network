package server

import (
	"fmt"
	"forum/pkg/consts"
	"forum/pkg/env"
	"log"
	"net/http"
)

func StartServer() {
	link := env.Get("SERVER_HOST")
	port := env.Get("SERVER_PORT")
	cert := env.Get("CERTIFICATE_PATH")
	key := env.Get("KEY_PATH")
	protocol := env.Get("PROTOCOL")

	fmt.Println(consts.CYAN + "Server Connected..." + consts.WHITE)
	fmt.Printf(consts.CYAN+"link on: %s%s"+consts.WHITE+"\n", protocol, link)
	fmt.Printf(consts.CYAN+"port%s"+consts.WHITE+"\n", port)

	server := &http.Server{
		Addr:    port,
		Handler: Router,
	}

	if protocol == "http" {
		err := server.ListenAndServe()
		if err != nil {
			log.Fatal(err)
		}
	} else if protocol == "https" {
		err := server.ListenAndServeTLS(cert, key)
		if err != nil {
			log.Fatal(err)
		}
	} else {
		log.Fatal("Invalid protocol type")
	}
}
