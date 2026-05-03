package api

import (
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mcpjungle/mcpjungle/pkg/apierrors"
)

// handleServiceError writes the appropriate HTTP error response for a service-layer error.
// It maps apierrors.ErrNotFound to 404 not found
// and apierrors.ErrInvalidInput to 400 bad request.
// all other errors become 500 with a generic message to avoid leaking internals.
func handleServiceError(c *gin.Context, err error) {
	if errors.Is(err, apierrors.ErrNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	if errors.Is(err, apierrors.ErrInvalidInput) {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	log.Printf("[ERROR] internal server error: %v", err)
	c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
}
