package middleware

import (
	"jaggle-grids/server/database"
	"jaggle-grids/server/models"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Bearer token required"})
			c.Abort()
			return
		}

		var session models.Session
		result := database.DB.Where("token = ? AND expires_at > ?", token, time.Now()).
			Preload("User").
			First(&session)

		if result.Error != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired session"})
			c.Abort()
			return
		}

		c.Set("user_id", session.UserID)
		c.Set("user", session.User)
		c.Next()
	}
}
