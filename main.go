package main

import (
	"forum/pkg/database"
	"forum/pkg/env"
	"forum/pkg/server"
)

func main() {
	env.Init()

	database.Init()

	server.StartRouter()

	server.StartServer()
}
