package handler

import (
	"jaggle-grids/internal/domain"
	"jaggle-grids/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type SpreadsheetHandler struct {
	sheets *service.SpreadsheetService
}

func NewSpreadsheetHandler(sheets *service.SpreadsheetService) *SpreadsheetHandler {
	return &SpreadsheetHandler{sheets: sheets}
}

func (h *SpreadsheetHandler) List(c *gin.Context) {
	ownerID := c.MustGet("user_id").(uint)

	items, err := h.sheets.List(c.Request.Context(), ownerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch spreadsheets"})
		return
	}

	c.JSON(http.StatusOK, items)
}

func (h *SpreadsheetHandler) Create(c *gin.Context) {
	ownerID := c.MustGet("user_id").(uint)

	var req domain.CreateSpreadsheetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title is required"})
		return
	}

	sheet, err := h.sheets.Create(c.Request.Context(), req.Title, ownerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create spreadsheet"})
		return
	}

	c.JSON(http.StatusCreated, sheet)
}

func (h *SpreadsheetHandler) Get(c *gin.Context) {
	ownerID := c.MustGet("user_id").(uint)
	id, err := parseID(c)
	if err != nil {
		return
	}

	sheet, err := h.sheets.Get(c.Request.Context(), id, ownerID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Spreadsheet not found"})
		return
	}

	c.JSON(http.StatusOK, sheet)
}

func (h *SpreadsheetHandler) Update(c *gin.Context) {
	ownerID := c.MustGet("user_id").(uint)
	id, err := parseID(c)
	if err != nil {
		return
	}

	var req domain.UpdateSpreadsheetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	sheet, err := h.sheets.Update(c.Request.Context(), id, ownerID, req.Title, req.Data)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Spreadsheet not found"})
		return
	}

	c.JSON(http.StatusOK, sheet)
}

func (h *SpreadsheetHandler) Delete(c *gin.Context) {
	ownerID := c.MustGet("user_id").(uint)
	id, err := parseID(c)
	if err != nil {
		return
	}

	if err := h.sheets.Delete(c.Request.Context(), id, ownerID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Spreadsheet not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Spreadsheet deleted"})
}

func parseID(c *gin.Context) (uint, error) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid spreadsheet ID"})
		return 0, err
	}
	return uint(id), nil
}
