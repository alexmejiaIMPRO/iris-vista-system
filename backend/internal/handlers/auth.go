package handlers

import (
	"github.com/gin-gonic/gin"
	"vista-backend/internal/middleware"
	"vista-backend/internal/services"
	"vista-backend/pkg/response"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginResponse struct {
	User        UserResponse `json:"user"`
	AccessToken string       `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	ExpiresIn   int64        `json:"expires_in"`
}

type UserResponse struct {
	ID          uint   `json:"id"`
	Email       string `json:"email"`
	Name        string `json:"name"`
	Role        string `json:"role"`
	CompanyCode string `json:"company_code"`
	CostCenter  string `json:"cost_center"`
	Department  string `json:"department"`
	Status      string `json:"status"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type RefreshResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

// Login handles user login
// @Summary User login
// @Description Authenticates a user and returns JWT tokens
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Login credentials"
// @Success 200 {object} LoginResponse
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Router /api/v1/auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	tokens, user, err := h.authService.Login(req.Email, req.Password)
	if err != nil {
		switch err {
		case services.ErrInvalidCredentials:
			response.Unauthorized(c, "Invalid email or password")
		case services.ErrUserInactive:
			response.Forbidden(c, "Account is inactive")
		default:
			response.InternalServerError(c, "Login failed")
		}
		return
	}

	response.Success(c, LoginResponse{
		User: UserResponse{
			ID:          user.ID,
			Email:       user.Email,
			Name:        user.Name,
			Role:        string(user.Role),
			CompanyCode: user.CompanyCode,
			CostCenter:  user.CostCenter,
			Department:  user.Department,
			Status:      user.Status,
		},
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresIn:    tokens.ExpiresIn,
	})
}

// Logout handles user logout
// @Summary User logout
// @Description Logs out the current user
// @Tags Auth
// @Security BearerAuth
// @Success 200 {object} response.Response
// @Router /api/v1/auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	// In a stateless JWT system, logout is handled client-side by removing tokens
	// For additional security, you could implement a token blacklist here
	response.SuccessWithMessage(c, "Logged out successfully", nil)
}

// Refresh refreshes the access token
// @Summary Refresh access token
// @Description Refreshes the access token using a valid refresh token
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body RefreshRequest true "Refresh token"
// @Success 200 {object} RefreshResponse
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Router /api/v1/auth/refresh [post]
func (h *AuthHandler) Refresh(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	tokens, err := h.authService.RefreshTokens(req.RefreshToken)
	if err != nil {
		response.Unauthorized(c, "Invalid or expired refresh token")
		return
	}

	response.Success(c, RefreshResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresIn:    tokens.ExpiresIn,
	})
}

// Me returns the current user's information
// @Summary Get current user
// @Description Returns the authenticated user's information
// @Tags Auth
// @Security BearerAuth
// @Success 200 {object} UserResponse
// @Failure 401 {object} response.Response
// @Router /api/v1/auth/me [get]
func (h *AuthHandler) Me(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		response.NotFound(c, "User not found")
		return
	}

	response.Success(c, UserResponse{
		ID:          user.ID,
		Email:       user.Email,
		Name:        user.Name,
		Role:        string(user.Role),
		CompanyCode: user.CompanyCode,
		CostCenter:  user.CostCenter,
		Department:  user.Department,
		Status:      user.Status,
	})
}
