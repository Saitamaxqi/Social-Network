package main

import (
	"social/backend/pkg/database"
	"social/backend/pkg/env"
	"social/backend/pkg/server"
	"social/backend/pkg/util"
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
