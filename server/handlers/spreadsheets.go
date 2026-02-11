package handlers

import (
	"jaggle-grids/server/database"
	"jaggle-grids/server/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ListSpreadsheets returns all spreadsheets owned by the current user.
func ListSpreadsheets(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var spreadsheets []models.Spreadsheet
	result := database.DB.
		Where("owner_id = ?", userID).
		Preload("Owner").
		Order("updated_at DESC").
		Find(&spreadsheets)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch spreadsheets"})
		return
	}

	// Map to list items (without data field for performance)
	items := make([]models.SpreadsheetListItem, len(spreadsheets))
	for i, s := range spreadsheets {
		items[i] = models.SpreadsheetListItem{
			ID:        s.ID,
			Title:     s.Title,
			OwnerID:   s.OwnerID,
			OwnerName: s.Owner.Name,
			CreatedAt: s.CreatedAt,
			UpdatedAt: s.UpdatedAt,
		}
	}

	c.JSON(http.StatusOK, items)
}

// CreateSpreadsheet creates a new spreadsheet for the current user.
func CreateSpreadsheet(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req models.CreateSpreadsheetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title is required"})
		return
	}

	spreadsheet := models.Spreadsheet{
		Title:   req.Title,
		OwnerID: userID.(uint),
		Data:    "", // Empty workbook, IronCalc will initialize on the client
	}

	if err := database.DB.Create(&spreadsheet).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create spreadsheet"})
		return
	}

	c.JSON(http.StatusCreated, spreadsheet)
}

// GetSpreadsheet returns a single spreadsheet by ID.
func GetSpreadsheet(c *gin.Context) {
	userID, _ := c.Get("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid spreadsheet ID"})
		return
	}

	var spreadsheet models.Spreadsheet
	result := database.DB.Where("id = ? AND owner_id = ?", id, userID).First(&spreadsheet)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Spreadsheet not found"})
		return
	}

	c.JSON(http.StatusOK, spreadsheet)
}

// UpdateSpreadsheet updates a spreadsheet's title or data.
func UpdateSpreadsheet(c *gin.Context) {
	userID, _ := c.Get("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid spreadsheet ID"})
		return
	}

	var spreadsheet models.Spreadsheet
	result := database.DB.Where("id = ? AND owner_id = ?", id, userID).First(&spreadsheet)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Spreadsheet not found"})
		return
	}

	var req models.UpdateSpreadsheetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	updates := map[string]interface{}{}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Data != "" {
		updates["data"] = req.Data
	}

	if len(updates) > 0 {
		database.DB.Model(&spreadsheet).Updates(updates)
	}

	// Reload
	database.DB.First(&spreadsheet, spreadsheet.ID)
	c.JSON(http.StatusOK, spreadsheet)
}

// DeleteSpreadsheet deletes a spreadsheet by ID.
func DeleteSpreadsheet(c *gin.Context) {
	userID, _ := c.Get("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid spreadsheet ID"})
		return
	}

	result := database.DB.Where("id = ? AND owner_id = ?", id, userID).Delete(&models.Spreadsheet{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Spreadsheet not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Spreadsheet deleted"})
}
