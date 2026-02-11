package sqlite

import (
	"context"
	"jaggle-grids/internal/domain"

	"gorm.io/gorm"
)

type UserRepo struct {
	db *gorm.DB
}

func NewUserRepo(db *gorm.DB) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	var u User
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&u).Error; err != nil {
		return nil, err
	}
	user := toDomainUser(u)
	return &user, nil
}

func (r *UserRepo) Create(ctx context.Context, user *domain.User) error {
	u := toGormUser(user)
	if err := r.db.WithContext(ctx).Create(&u).Error; err != nil {
		return err
	}
	user.ID = u.ID
	user.CreatedAt = u.CreatedAt
	user.UpdatedAt = u.UpdatedAt
	return nil
}
