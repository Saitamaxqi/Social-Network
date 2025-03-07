package main

import (
	"forum/pkg/database"
	"forum/pkg/env"
	"forum/pkg/server"
	"forum/pkg/util"
	"log"
)

func main() {
	env.Init()

	database.Init()

	// Initialize storage directories
	if err := util.InitializeStorage(); err != nil {
		log.Fatalf("Failed to initialize storage directories: %v", err)
	}

	server.StartRouter()

	server.StartServer()
}
