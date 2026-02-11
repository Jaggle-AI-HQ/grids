package main

import (
	"jaggle-grids/server/database"
	"jaggle-grids/server/handlers"
	"jaggle-grids/server/middleware"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

// Version is set at build time via -ldflags.
var Version = "dev"

func main() {
	// Initialize database
	database.Init()

	// Set Gin mode
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		origin := os.Getenv("CORS_ORIGIN")
		if origin == "" {
			origin = "http://localhost:5173"
		}
		c.Header("Access-Control-Allow-Origin", origin)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Health check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "Jaggle Grids", "version": Version})
	})

	// Auth routes (no auth required)
	r.POST("/api/auth/login", handlers.MockLogin)

	// Protected routes
	auth := r.Group("/api")
	auth.Use(middleware.AuthRequired())
	{
		// Auth
		auth.GET("/auth/me", handlers.GetCurrentUser)
		auth.POST("/auth/logout", handlers.Logout)

		// Spreadsheets
		auth.GET("/spreadsheets", handlers.ListSpreadsheets)
		auth.POST("/spreadsheets", handlers.CreateSpreadsheet)
		auth.GET("/spreadsheets/:id", handlers.GetSpreadsheet)
		auth.PATCH("/spreadsheets/:id", handlers.UpdateSpreadsheet)
		auth.DELETE("/spreadsheets/:id", handlers.DeleteSpreadsheet)
	}

	// Serve static frontend files in production
	if _, err := os.Stat("frontend/dist"); err == nil {
		r.Static("/assets", "frontend/dist/assets")
		r.NoRoute(func(c *gin.Context) {
			c.File("frontend/dist/index.html")
		})
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Jaggle Grids %s starting on :%s", Version, port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
