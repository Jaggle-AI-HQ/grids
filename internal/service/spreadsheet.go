package service

import (
	"context"
	"fmt"
	"jaggle-grids/internal/domain"
)

type SpreadsheetService struct {
	sheets domain.SpreadsheetRepository
}

func NewSpreadsheetService(sheets domain.SpreadsheetRepository) *SpreadsheetService {
	return &SpreadsheetService{sheets: sheets}
}

func (s *SpreadsheetService) List(ctx context.Context, ownerID uint) ([]domain.SpreadsheetListItem, error) {
	sheets, err := s.sheets.ListByOwner(ctx, ownerID)
	if err != nil {
		return nil, fmt.Errorf("list spreadsheets: %w", err)
	}

	items := make([]domain.SpreadsheetListItem, len(sheets))
	for i, sh := range sheets {
		ownerName := ""
		if sh.Owner != nil {
			ownerName = sh.Owner.Name
		}
		items[i] = domain.SpreadsheetListItem{
			ID:        sh.ID,
			Title:     sh.Title,
			OwnerID:   sh.OwnerID,
			OwnerName: ownerName,
			CreatedAt: sh.CreatedAt,
			UpdatedAt: sh.UpdatedAt,
		}
	}
	return items, nil
}

func (s *SpreadsheetService) Get(ctx context.Context, id, ownerID uint) (*domain.Spreadsheet, error) {
	sheet, err := s.sheets.FindByIDAndOwner(ctx, id, ownerID)
	if err != nil {
		return nil, fmt.Errorf("spreadsheet not found: %w", err)
	}
	return sheet, nil
}

func (s *SpreadsheetService) Create(ctx context.Context, title string, ownerID uint) (*domain.Spreadsheet, error) {
	sheet := &domain.Spreadsheet{
		Title:   title,
		OwnerID: ownerID,
		Data:    "",
	}
	if err := s.sheets.Create(ctx, sheet); err != nil {
		return nil, fmt.Errorf("create spreadsheet: %w", err)
	}
	return sheet, nil
}

func (s *SpreadsheetService) Update(ctx context.Context, id, ownerID uint, title, data string) (*domain.Spreadsheet, error) {
	sheet, err := s.sheets.FindByIDAndOwner(ctx, id, ownerID)
	if err != nil {
		return nil, fmt.Errorf("spreadsheet not found: %w", err)
	}

	fields := map[string]any{}
	if title != "" {
		fields["title"] = title
	}
	if data != "" {
		fields["data"] = data
	}
	if len(fields) == 0 {
		return sheet, nil
	}

	if err := s.sheets.Update(ctx, sheet, fields); err != nil {
		return nil, fmt.Errorf("update spreadsheet: %w", err)
	}
	return sheet, nil
}

func (s *SpreadsheetService) Delete(ctx context.Context, id, ownerID uint) error {
	if err := s.sheets.Delete(ctx, id, ownerID); err != nil {
		return fmt.Errorf("spreadsheet not found: %w", err)
	}
	return nil
}
