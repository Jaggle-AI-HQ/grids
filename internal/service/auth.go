package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"jaggle-grids/internal/domain"
	"time"
)

type AuthService struct {
	users    domain.UserRepository
	sessions domain.SessionRepository
}

func NewAuthService(users domain.UserRepository, sessions domain.SessionRepository) *AuthService {
	return &AuthService{users: users, sessions: sessions}
}

// Login finds or creates a user by email and returns a session token.
func (s *AuthService) Login(ctx context.Context, email, name string) (*domain.AuthResponse, error) {
	user, err := s.users.FindByEmail(ctx, email)
	if err != nil {
		// User not found — create one
		user = &domain.User{Email: email, Name: name}
		if err := s.users.Create(ctx, user); err != nil {
			return nil, fmt.Errorf("create user: %w", err)
		}
	}

	token, err := generateToken()
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	session := &domain.Session{
		Token:     token,
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	}
	if err := s.sessions.Create(ctx, session); err != nil {
		return nil, fmt.Errorf("create session: %w", err)
	}

	return &domain.AuthResponse{Token: token, User: *user}, nil
}

// Authenticate validates a Bearer token and returns the associated session.
func (s *AuthService) Authenticate(ctx context.Context, token string) (*domain.Session, error) {
	session, err := s.sessions.FindValidByToken(ctx, token)
	if err != nil {
		return nil, errors.New("invalid or expired session")
	}
	return session, nil
}

// Logout invalidates a session.
func (s *AuthService) Logout(ctx context.Context, token string, userID uint) error {
	return s.sessions.DeleteByTokenAndUser(ctx, token, userID)
}

func generateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
