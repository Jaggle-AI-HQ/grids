package sqlite

import (
	"context"
	"jaggle-grids/internal/domain"

	"gorm.io/gorm"
)

type SpreadsheetRepo struct {
	db *gorm.DB
}

func NewSpreadsheetRepo(db *gorm.DB) *SpreadsheetRepo {
	return &SpreadsheetRepo{db: db}
}

func (r *SpreadsheetRepo) ListByOwner(ctx context.Context, ownerID uint) ([]domain.Spreadsheet, error) {
	var rows []Spreadsheet
	err := r.db.WithContext(ctx).
		Where("owner_id = ?", ownerID).
		Preload("Owner").
		Order("updated_at DESC").
		Find(&rows).Error
	if err != nil {
		return nil, err
	}

	out := make([]domain.Spreadsheet, len(rows))
	for i, s := range rows {
		out[i] = toDomainSpreadsheet(s)
	}
	return out, nil
}

func (r *SpreadsheetRepo) FindByIDAndOwner(ctx context.Context, id, ownerID uint) (*domain.Spreadsheet, error) {
	var s Spreadsheet
	err := r.db.WithContext(ctx).Where("id = ? AND owner_id = ?", id, ownerID).First(&s).Error
	if err != nil {
		return nil, err
	}
	sheet := toDomainSpreadsheet(s)
	return &sheet, nil
}

func (r *SpreadsheetRepo) Create(ctx context.Context, spreadsheet *domain.Spreadsheet) error {
	s := Spreadsheet{
		Title:   spreadsheet.Title,
		OwnerID: spreadsheet.OwnerID,
		Data:    spreadsheet.Data,
	}
	if err := r.db.WithContext(ctx).Create(&s).Error; err != nil {
		return err
	}
	spreadsheet.ID = s.ID
	spreadsheet.CreatedAt = s.CreatedAt
	spreadsheet.UpdatedAt = s.UpdatedAt
	return nil
}

func (r *SpreadsheetRepo) Update(ctx context.Context, spreadsheet *domain.Spreadsheet, fields map[string]any) error {
	s := Spreadsheet{ID: spreadsheet.ID}
	if err := r.db.WithContext(ctx).Model(&s).Updates(fields).Error; err != nil {
		return err
	}
	// Reload to get updated timestamps
	if err := r.db.WithContext(ctx).First(&s, s.ID).Error; err != nil {
		return err
	}
	spreadsheet.Title = s.Title
	spreadsheet.Data = s.Data
	spreadsheet.UpdatedAt = s.UpdatedAt
	return nil
}

func (r *SpreadsheetRepo) Delete(ctx context.Context, id, ownerID uint) error {
	result := r.db.WithContext(ctx).Where("id = ? AND owner_id = ?", id, ownerID).Delete(&Spreadsheet{})
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return result.Error
}
