package middleware

import (
	"github.com/gin-gonic/gin"
	"vista-backend/internal/models"
	"vista-backend/pkg/response"
)

// RequireRole returns middleware that requires specific roles
func RequireRole(allowedRoles ...models.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := GetUserRole(c)
		if userRole == "" {
			response.Unauthorized(c, "Authentication required")
			c.Abort()
			return
		}

		// Check if user's role is in allowed roles
		for _, role := range allowedRoles {
			if models.UserRole(userRole) == role {
				c.Next()
				return
			}
		}

		response.Forbidden(c, "Insufficient permissions")
		c.Abort()
	}
}

// RequireAdmin requires admin role
func RequireAdmin() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin)
}

// RequireAdminOrSupplyChain requires admin or supply chain manager role
func RequireAdminOrSupplyChain() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin, models.RoleSupplyChainManager)
}

// RequireApprover requires a role that can approve requests
func RequireApprover() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin, models.RoleGeneralManager)
}

// RequireManager requires a manager-level role
func RequireManager() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin, models.RoleSupplyChainManager, models.RoleGeneralManager)
}

// CanViewAllRequests checks if user can view all requests
func CanViewAllRequests() gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := GetUserRole(c)
		if userRole == "" {
			response.Unauthorized(c, "Authentication required")
			c.Abort()
			return
		}

		role := models.UserRole(userRole)
		if role == models.RoleAdmin || role == models.RoleSupplyChainManager || role == models.RoleGeneralManager {
			c.Set("can_view_all", true)
		} else {
			c.Set("can_view_all", false)
		}

		c.Next()
	}
}

// CanViewAll extracts the can_view_all flag from context
func CanViewAll(c *gin.Context) bool {
	if canView, exists := c.Get("can_view_all"); exists {
		return canView.(bool)
	}
	return false
}
