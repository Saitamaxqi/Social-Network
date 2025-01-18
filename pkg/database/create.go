package database

import (
	"forum/pkg/models"
	_ "github.com/mattn/go-sqlite3"
)

func CreateTables() error {
	models := []models.Model{
		&models.User{},
		&models.Session{},
		&models.Post{},
		&models.PostInteraction{},
		&models.Category{},
		&models.PostCategory{},
		&models.Report{},
		&models.Notification{},
		&models.PrivateMessage{},
	}

	for _, model := range models {
		err := model.CreateTable()
		if err != nil {
			return err
		}
	}

	return nil
}
