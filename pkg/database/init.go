package database

import (
	"forum/pkg/env"
	"forum/pkg/models"
	"log"
	"os"
)

func Init() {
	err := Connect()
	if err != nil {
		log.Fatal(err)
	}

	path := env.Get("DB_PATH")
	_, err = os.Stat(path)

	err = CreateTables()
	if err != nil {
		log.Fatal(err)
	}
// fix this to match the new database
admin := &models.User{
    Username:  "admin",
    Age:       30,
    Gender:    "male",
    FirstName: "Admin",
    LastName:  "User",
    Email:     "admin@formhub.com",
    Password:  "admin",
    Type:      "admin",
}


	admin.Create()
}
