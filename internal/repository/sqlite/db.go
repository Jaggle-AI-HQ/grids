package sqlite

import (
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Open initialises a SQLite connection and runs auto-migrations.
func Open(dbPath string) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if err := db.AutoMigrate(&User{}, &Spreadsheet{}, &Session{}); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	log.Println("Database initialized successfully")
	return db
}
