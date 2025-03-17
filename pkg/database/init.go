package database

import (
	"database/sql"
	"forum/pkg/env"
	"forum/pkg/models"
	"log"
	"os"
	"time"
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
	
	// Create default admin user
	admin := &models.User{
		Username:    "admin",
		DateOfBirth: time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC),
		Gender:     "male",
		FirstName:  "Admin",
		LastName:   "User",
		Email:      "admin@social.com",
		Password:   "admin",
		Type:       "admin",
		Avatar:     sql.NullString{String: "", Valid: false},
		ProfileType: "private",
		AboutMe:    "System Administrator",
	}
	admin.Create()
	
	// Create default categories
	createDefaultCategories()
}

// createDefaultCategories creates the default categories if they don't exist
func createDefaultCategories() {
	// Default categories
	defaultCategories := []string{
		"Tech",
		"Lifestyle",
		"Food",
		"Anime",
		"Video Games",
		"Beauty",
	}
	
	// Create each category if it doesn't exist
	for _, categoryName := range defaultCategories {
		category := &models.Category{
			Name: categoryName,
		}
		
		// Check if category already exists
		exists, err := categoryExists(categoryName)
		if err != nil {
			continue
		}
		
		if !exists {
			category.Create()
		}
	}
}

// categoryExists checks if a category with the given name already exists
func categoryExists(name string) (bool, error) {
	rows, err := models.DB.Query("SELECT COUNT(*) FROM categories WHERE name = ?", name)
	if err != nil {
		return false, err
	}
	defer rows.Close()
	
	var count int
	if rows.Next() {
		err = rows.Scan(&count)
		if err != nil {
			return false, err
		}
	}
	
	return count > 0, nil
}
