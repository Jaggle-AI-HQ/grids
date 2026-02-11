package sqlite

import (
	"jaggle-grids/internal/domain"
	"time"
)

// ── GORM models (persistence concern only) ───

type User struct {
	ID        uint   `gorm:"primaryKey"`
	Email     string `gorm:"uniqueIndex;not null"`
	Name      string `gorm:"not null"`
	AvatarURL string
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Spreadsheet struct {
	ID        uint   `gorm:"primaryKey"`
	Title     string `gorm:"not null"`
	OwnerID   uint   `gorm:"not null;index"`
	Owner     User   `gorm:"foreignKey:OwnerID"`
	Data      string `gorm:"type:text"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Session struct {
	ID        uint   `gorm:"primaryKey"`
	Token     string `gorm:"uniqueIndex;not null"`
	UserID    uint   `gorm:"not null;index"`
	User      User   `gorm:"foreignKey:UserID"`
	ExpiresAt time.Time
	CreatedAt time.Time
}

// ── Mappers ──────────────────────────────────

func toDomainUser(u User) domain.User {
	return domain.User{
		ID:        u.ID,
		Email:     u.Email,
		Name:      u.Name,
		AvatarURL: u.AvatarURL,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

func toGormUser(u *domain.User) User {
	return User{
		ID:        u.ID,
		Email:     u.Email,
		Name:      u.Name,
		AvatarURL: u.AvatarURL,
	}
}

func toDomainSpreadsheet(s Spreadsheet) domain.Spreadsheet {
	owner := toDomainUser(s.Owner)
	return domain.Spreadsheet{
		ID:        s.ID,
		Title:     s.Title,
		OwnerID:   s.OwnerID,
		Owner:     &owner,
		Data:      s.Data,
		CreatedAt: s.CreatedAt,
		UpdatedAt: s.UpdatedAt,
	}
}

func toDomainSession(s Session) domain.Session {
	user := toDomainUser(s.User)
	return domain.Session{
		ID:        s.ID,
		Token:     s.Token,
		UserID:    s.UserID,
		User:      &user,
		ExpiresAt: s.ExpiresAt,
		CreatedAt: s.CreatedAt,
	}
}
