package database

import (
	"database/sql"
	"social/backend/pkg/env"
	"social/backend/pkg/models"
	"social/backend/pkg/database/sqlite"
	"log"
	"time"
)

func Init() {
	// Get database path from environment
	path := env.Get("DB_PATH")
	
	// Initialize the database with migrations
	err := sqlite.Initialize(path)
	if err != nil {
		log.Fatal("Failed to initialize database with migrations:", err)
	}
	
	// Set the models.DB reference to use the same connection
	models.DB = sqlite.GetDB()
	
	// Create default admin user if it doesn't exist
	createDefaultAdminIfNotExists()
	
	// Create default categories
	createDefaultCategories()
}

// createDefaultAdminIfNotExists creates the default admin user if it doesn't exist
func createDefaultAdminIfNotExists() {
	// Check if admin user exists
	var count int
	err := models.DB.QueryRow("SELECT COUNT(*) FROM users WHERE username = 'admin'").Scan(&count)
	if err != nil || count > 0 {
		return // Admin exists or error occurred
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
	err = admin.Create()
	if err != nil {
		log.Printf("Failed to create admin user: %v", err)
	} else {
		log.Println("Default admin user created successfully")
	}
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
