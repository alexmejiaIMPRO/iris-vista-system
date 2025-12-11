package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"vista-backend/pkg/jwt"
	"vista-backend/pkg/response"
)

const (
	AuthorizationHeader = "Authorization"
	BearerSchema        = "Bearer"
	UserIDKey           = "user_id"
	UserEmailKey        = "user_email"
	UserRoleKey         = "user_role"
)

// Auth returns an authentication middleware
func Auth(jwtService *jwt.JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader(AuthorizationHeader)
		if authHeader == "" {
			response.Unauthorized(c, "Authorization header is required")
			c.Abort()
			return
		}

		// Check Bearer schema
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != BearerSchema {
			response.Unauthorized(c, "Invalid authorization header format")
			c.Abort()
			return
		}

		token := parts[1]
		claims, err := jwtService.ValidateAccessToken(token)
		if err != nil {
			if err == jwt.ErrExpiredToken {
				response.Unauthorized(c, "Token has expired")
			} else {
				response.Unauthorized(c, "Invalid token")
			}
			c.Abort()
			return
		}

		// Store user info in context
		c.Set(UserIDKey, claims.UserID)
		c.Set(UserEmailKey, claims.Email)
		c.Set(UserRoleKey, claims.Role)

		c.Next()
	}
}

// GetUserID extracts user ID from context
func GetUserID(c *gin.Context) uint {
	if userID, exists := c.Get(UserIDKey); exists {
		return userID.(uint)
	}
	return 0
}

// GetUserEmail extracts user email from context
func GetUserEmail(c *gin.Context) string {
	if email, exists := c.Get(UserEmailKey); exists {
		return email.(string)
	}
	return ""
}

// GetUserRole extracts user role from context
func GetUserRole(c *gin.Context) string {
	if role, exists := c.Get(UserRoleKey); exists {
		return role.(string)
	}
	return ""
}

// OptionalAuth is middleware that doesn't require auth but sets user info if present
func OptionalAuth(jwtService *jwt.JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader(AuthorizationHeader)
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != BearerSchema {
			c.Next()
			return
		}

		token := parts[1]
		claims, err := jwtService.ValidateAccessToken(token)
		if err == nil {
			c.Set(UserIDKey, claims.UserID)
			c.Set(UserEmailKey, claims.Email)
			c.Set(UserRoleKey, claims.Role)
		}

		c.Next()
	}
}
