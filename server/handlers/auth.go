package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"jaggle-grids/server/database"
	"jaggle-grids/server/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func generateToken() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// MockLogin handles the mocked authentication flow.
// In production, this will be replaced with Jaggle's OAuth integration.
func MockLogin(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: email and name are required"})
		return
	}

	// Find or create user
	var user models.User
	result := database.DB.Where("email = ?", req.Email).First(&user)
	if result.Error != nil {
		// Create new user
		user = models.User{
			Email:     req.Email,
			Name:      req.Name,
			AvatarURL: "",
		}
		if err := database.DB.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
	}

	// Create session
	token := generateToken()
	session := models.Session{
		Token:     token,
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour), // 7 days
	}
	if err := database.DB.Create(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		Token: token,
		User:  user,
	})
}

// GetCurrentUser returns the authenticated user's profile.
func GetCurrentUser(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	c.JSON(http.StatusOK, user)
}

// Logout invalidates the current session.
func Logout(c *gin.Context) {
	userID, _ := c.Get("user_id")
	token := c.GetHeader("Authorization")
	token = token[7:] // Remove "Bearer "

	database.DB.Where("token = ? AND user_id = ?", token, userID).Delete(&models.Session{})
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}
