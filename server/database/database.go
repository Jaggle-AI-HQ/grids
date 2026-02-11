package database

import (
	"jaggle-grids/server/models"
	"log"
	"os"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Init() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "jaggle_grids.db"
	}

	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	err = DB.AutoMigrate(&models.User{}, &models.Spreadsheet{}, &models.Session{})
	if err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	log.Println("Database initialized successfully")
}
