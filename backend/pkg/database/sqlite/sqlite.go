package sqlite

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/mattn/go-sqlite3"
)

var (
	db *sql.DB
)

// Initialize initializes the SQLite database and runs migrations
func Initialize(dbPath string) error {
	// Ensure the directory exists
	dbDir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		return fmt.Errorf("failed to create database directory: %w", err)
	}

	// Open the database connection
	var err error
	db, err = sql.Open("sqlite3", dbPath+"?_foreign_keys=on")
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	// Test the connection
	if err = db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	// Run migrations
	if err = runMigrations(); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("Database initialized successfully")
	return nil
}

// GetDB returns the database connection
func GetDB() *sql.DB {
	return db
}

// Close closes the database connection
func Close() error {
	if db != nil {
		return db.Close()
	}
	return nil
}

// runMigrations runs all database migrations
func runMigrations() error {
	if db == nil {
		return errors.New("database not initialized")
	}

	// Create a new migration instance
	driver, err := sqlite3.WithInstance(db, &sqlite3.Config{})
	if err != nil {
		return fmt.Errorf("failed to create migration driver: %w", err)
	}

	// Get the absolute path to the migrations directory
	migrationsPath := filepath.Join("file://", filepath.Clean(filepath.Join(os.Getenv("PWD"), "backend/pkg/database/migrations/sqlite")))
	
	// Create a new migrate instance
	m, err := migrate.NewWithDatabaseInstance(
		migrationsPath,
		"sqlite3", 
		driver,
	)
	if err != nil {
		return fmt.Errorf("failed to create migration instance: %w", err)
	}

	// Run migrations
	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("Migrations completed successfully")
	return nil
}

// RunMigrationUp applies a specific migration
func RunMigrationUp(version uint) error {
	if db == nil {
		return errors.New("database not initialized")
	}

	driver, err := sqlite3.WithInstance(db, &sqlite3.Config{})
	if err != nil {
		return fmt.Errorf("failed to create migration driver: %w", err)
	}

	migrationsPath := filepath.Join("file://", filepath.Clean(filepath.Join(os.Getenv("PWD"), "backend/pkg/database/migrations/sqlite")))
	
	m, err := migrate.NewWithDatabaseInstance(
		migrationsPath,
		"sqlite3", 
		driver,
	)
	if err != nil {
		return fmt.Errorf("failed to create migration instance: %w", err)
	}

	if err := m.Migrate(version); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("failed to apply migration %d: %w", version, err)
	}

	return nil
}

// RunMigrationDown rolls back a specific migration
func RunMigrationDown(version uint) error {
	if db == nil {
		return errors.New("database not initialized")
	}

	driver, err := sqlite3.WithInstance(db, &sqlite3.Config{})
	if err != nil {
		return fmt.Errorf("failed to create migration driver: %w", err)
	}

	migrationsPath := filepath.Join("file://", filepath.Clean(filepath.Join(os.Getenv("PWD"), "backend/pkg/database/migrations/sqlite")))
	
	m, err := migrate.NewWithDatabaseInstance(
		migrationsPath,
		"sqlite3", 
		driver,
	)
	if err != nil {
		return fmt.Errorf("failed to create migration instance: %w", err)
	}

	// Force version to the previous version
	if err := m.Force(int(version)); err != nil {
		return fmt.Errorf("failed to force migration version: %w", err)
	}

	return nil
}

// GetMigrationVersion returns the current migration version
func GetMigrationVersion() (uint, bool, error) {
	if db == nil {
		return 0, false, errors.New("database not initialized")
	}

	driver, err := sqlite3.WithInstance(db, &sqlite3.Config{})
	if err != nil {
		return 0, false, fmt.Errorf("failed to create migration driver: %w", err)
	}

	migrationsPath := filepath.Join("file://", filepath.Clean(filepath.Join(os.Getenv("PWD"), "backend/pkg/database/migrations/sqlite")))
	
	m, err := migrate.NewWithDatabaseInstance(
		migrationsPath,
		"sqlite3", 
		driver,
	)
	if err != nil {
		return 0, false, fmt.Errorf("failed to create migration instance: %w", err)
	}

	version, dirty, err := m.Version()
	if err != nil {
		if errors.Is(err, migrate.ErrNilVersion) {
			return 0, false, nil
		}
		return 0, false, fmt.Errorf("failed to get migration version: %w", err)
	}

	return version, dirty, nil
}
