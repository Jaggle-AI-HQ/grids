package sqlite

import (
	"context"
	"jaggle-grids/internal/domain"
	"time"

	"gorm.io/gorm"
)

type SessionRepo struct {
	db *gorm.DB
}

func NewSessionRepo(db *gorm.DB) *SessionRepo {
	return &SessionRepo{db: db}
}

func (r *SessionRepo) Create(ctx context.Context, session *domain.Session) error {
	s := Session{
		Token:     session.Token,
		UserID:    session.UserID,
		ExpiresAt: session.ExpiresAt,
	}
	if err := r.db.WithContext(ctx).Create(&s).Error; err != nil {
		return err
	}
	session.ID = s.ID
	session.CreatedAt = s.CreatedAt
	return nil
}

func (r *SessionRepo) FindValidByToken(ctx context.Context, token string) (*domain.Session, error) {
	var s Session
	err := r.db.WithContext(ctx).
		Where("token = ? AND expires_at > ?", token, time.Now()).
		Preload("User").
		First(&s).Error
	if err != nil {
		return nil, err
	}
	session := toDomainSession(s)
	return &session, nil
}

func (r *SessionRepo) DeleteByTokenAndUser(ctx context.Context, token string, userID uint) error {
	return r.db.WithContext(ctx).
		Where("token = ? AND user_id = ?", token, userID).
		Delete(&Session{}).Error
}
