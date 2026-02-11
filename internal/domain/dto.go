package domain

import "time"

// ── Requests ─────────────────────────────────

type LoginRequest struct {
	Email string `json:"email" binding:"required,email"`
	Name  string `json:"name" binding:"required"`
}

type CreateSpreadsheetRequest struct {
	Title string `json:"title" binding:"required"`
}

type UpdateSpreadsheetRequest struct {
	Title string `json:"title,omitempty"`
	Data  string `json:"data,omitempty"`
}

// ── Responses ────────────────────────────────

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type SpreadsheetListItem struct {
	ID        uint      `json:"id"`
	Title     string    `json:"title"`
	OwnerID   uint      `json:"owner_id"`
	OwnerName string    `json:"owner_name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
