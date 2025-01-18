package database

import (
	"database/sql"
	"fmt"
	"forum/pkg/env"
	"forum/pkg/models"
)

func Connect() error {
	path := env.Get("DB_PATH")
	user := env.Get("DB_USER")
	password := env.Get("DB_PASSWORD")

	db, err := sql.Open("sqlite3", fmt.Sprintf("%s?_auth&_auth_user=%s&_auth_pass=%s", path, user, password))
	if err != nil {
		return err
	}

	models.DB = db

	_, err = db.Exec("PRAGMA foreign_keys = ON")
	if err != nil {
		return err
	}

	return nil
}
