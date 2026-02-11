package models

import "time"

type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Email     string    `json:"email" gorm:"uniqueIndex;not null"`
	Name      string    `json:"name" gorm:"not null"`
	AvatarURL string    `json:"avatar_url"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Spreadsheet struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Title     string    `json:"title" gorm:"not null"`
	OwnerID   uint      `json:"owner_id" gorm:"not null;index"`
	Owner     User      `json:"owner,omitempty" gorm:"foreignKey:OwnerID"`
	Data      string    `json:"data,omitempty" gorm:"type:text"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Session struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Token     string    `json:"token" gorm:"uniqueIndex;not null"`
	UserID    uint      `json:"user_id" gorm:"not null;index"`
	User      User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

// API request/response types

type LoginRequest struct {
	Email string `json:"email" binding:"required,email"`
	Name  string `json:"name" binding:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type CreateSpreadsheetRequest struct {
	Title string `json:"title" binding:"required"`
}

type UpdateSpreadsheetRequest struct {
	Title string `json:"title,omitempty"`
	Data  string `json:"data,omitempty"`
}

type SpreadsheetListItem struct {
	ID        uint      `json:"id"`
	Title     string    `json:"title"`
	OwnerID   uint      `json:"owner_id"`
	OwnerName string    `json:"owner_name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
