package domain

import "time"

type User struct {
	ID        uint      `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	AvatarURL string    `json:"avatar_url"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Spreadsheet struct {
	ID        uint      `json:"id"`
	Title     string    `json:"title"`
	OwnerID   uint      `json:"owner_id"`
	Owner     *User     `json:"owner,omitempty"`
	Data      string    `json:"data,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Session struct {
	ID        uint      `json:"id"`
	Token     string    `json:"token"`
	UserID    uint      `json:"user_id"`
	User      *User     `json:"user,omitempty"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}
