package api

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mcpjungle/mcpjungle/pkg/version"
)

func (s *Server) getSettingsHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		cfg, err := s.configService.GetConfig()
		if err != nil {
			log.Printf("[ERROR] failed to get server config: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"initialized":            cfg.Initialized,
			"mode":                   cfg.Mode,
			"version":                version.GetVersion(),
			"can_apply_local_config": canApplyConfigLocally(c.Request),
		})
	}
}
