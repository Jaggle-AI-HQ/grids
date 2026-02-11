package domain

import "context"

type UserRepository interface {
	FindByEmail(ctx context.Context, email string) (*User, error)
	Create(ctx context.Context, user *User) error
}

type SpreadsheetRepository interface {
	ListByOwner(ctx context.Context, ownerID uint) ([]Spreadsheet, error)
	FindByIDAndOwner(ctx context.Context, id, ownerID uint) (*Spreadsheet, error)
	Create(ctx context.Context, spreadsheet *Spreadsheet) error
	Update(ctx context.Context, spreadsheet *Spreadsheet, fields map[string]any) error
	Delete(ctx context.Context, id, ownerID uint) error
}

type SessionRepository interface {
	Create(ctx context.Context, session *Session) error
	FindValidByToken(ctx context.Context, token string) (*Session, error)
	DeleteByTokenAndUser(ctx context.Context, token string, userID uint) error
}
