package main

import (
	"jaggle-grids/internal/handler"
	"jaggle-grids/internal/middleware"
	"jaggle-grids/internal/repository/sqlite"
	"jaggle-grids/internal/service"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

// Version is set at build time via -ldflags.
var Version = "dev"

func main() {
	// ── Config ────────────────────────────────
	port := envOr("PORT", "8080")
	dbPath := envOr("DB_PATH", "jaggle_grids.db")
	corsOrigin := envOr("CORS_ORIGIN", "http://localhost:5173")

	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// ── Database ──────────────────────────────
	db := sqlite.Open(dbPath)

	// ── Repositories ──────────────────────────
	userRepo := sqlite.NewUserRepo(db)
	sessionRepo := sqlite.NewSessionRepo(db)
	sheetRepo := sqlite.NewSpreadsheetRepo(db)

	// ── Services ──────────────────────────────
	authSvc := service.NewAuthService(userRepo, sessionRepo)
	sheetSvc := service.NewSpreadsheetService(sheetRepo)

	// ── Handlers ──────────────────────────────
	authHandler := handler.NewAuthHandler(authSvc)
	sheetHandler := handler.NewSpreadsheetHandler(sheetSvc)

	// ── Router ────────────────────────────────
	r := gin.Default()
	r.Use(middleware.CORS(corsOrigin))

	// Health check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "Jaggle Grids", "version": Version})
	})

	// Public routes
	r.POST("/api/auth/login", authHandler.Login)

	// Protected routes
	auth := r.Group("/api")
	auth.Use(middleware.AuthRequired(authSvc))
	{
		auth.GET("/auth/me", authHandler.GetCurrentUser)
		auth.POST("/auth/logout", authHandler.Logout)

		auth.GET("/spreadsheets", sheetHandler.List)
		auth.POST("/spreadsheets", sheetHandler.Create)
		auth.GET("/spreadsheets/:id", sheetHandler.Get)
		auth.PATCH("/spreadsheets/:id", sheetHandler.Update)
		auth.DELETE("/spreadsheets/:id", sheetHandler.Delete)
	}

	// Serve static frontend files in production
	if _, err := os.Stat("frontend/dist"); err == nil {
		r.Static("/assets", "frontend/dist/assets")
		r.NoRoute(func(c *gin.Context) {
			c.File("frontend/dist/index.html")
		})
	}

	log.Printf("Jaggle Grids %s starting on :%s", Version, port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
