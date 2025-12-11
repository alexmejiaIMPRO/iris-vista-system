package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"vista-backend/internal/middleware"
	"vista-backend/internal/models"
	"vista-backend/internal/services"
	"vista-backend/pkg/response"
)

type UserHandler struct {
	db *gorm.DB
}

func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{db: db}
}

type CreateUserRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=6"`
	Name        string `json:"name" binding:"required"`
	Role        string `json:"role" binding:"required,oneof=admin supply_chain_manager general_manager employee"`
	CompanyCode string `json:"company_code"`
	CostCenter  string `json:"cost_center"`
	Department  string `json:"department"`
}

type UpdateUserRequest struct {
	Email       string `json:"email" binding:"omitempty,email"`
	Name        string `json:"name"`
	Role        string `json:"role" binding:"omitempty,oneof=admin supply_chain_manager general_manager employee"`
	CompanyCode string `json:"company_code"`
	CostCenter  string `json:"cost_center"`
	Department  string `json:"department"`
	Status      string `json:"status" binding:"omitempty,oneof=active inactive"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}

// ListUsers returns a list of all users
func (h *UserHandler) ListUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	search := c.Query("search")
	role := c.Query("role")
	status := c.Query("status")

	offset := (page - 1) * perPage

	query := h.db.Model(&models.User{})

	if search != "" {
		query = query.Where("name LIKE ? OR email LIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if role != "" {
		query = query.Where("role = ?", role)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var users []models.User
	if err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&users).Error; err != nil {
		response.InternalServerError(c, "Failed to fetch users")
		return
	}

	userResponses := make([]UserResponse, len(users))
	for i, user := range users {
		userResponses[i] = UserResponse{
			ID:          user.ID,
			Email:       user.Email,
			Name:        user.Name,
			Role:        string(user.Role),
			CompanyCode: user.CompanyCode,
			CostCenter:  user.CostCenter,
			Department:  user.Department,
			Status:      user.Status,
		}
	}

	response.SuccessWithMeta(c, userResponses, &response.Meta{
		Page:       page,
		PerPage:    perPage,
		Total:      total,
		TotalPages: response.CalculateTotalPages(total, perPage),
	})
}

// GetUser returns a single user
func (h *UserHandler) GetUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "User not found")
		} else {
			response.InternalServerError(c, "Failed to fetch user")
		}
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

// CreateUser creates a new user
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	// Check if email already exists
	var existingUser models.User
	if err := h.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		response.Conflict(c, "Email already exists")
		return
	}

	// Hash password
	hashedPassword, err := services.HashPassword(req.Password)
	if err != nil {
		response.InternalServerError(c, "Failed to hash password")
		return
	}

	user := models.User{
		Email:        req.Email,
		PasswordHash: hashedPassword,
		Name:         req.Name,
		Role:         models.UserRole(req.Role),
		CompanyCode:  req.CompanyCode,
		CostCenter:   req.CostCenter,
		Department:   req.Department,
		Status:       "active",
	}

	if err := h.db.Create(&user).Error; err != nil {
		response.InternalServerError(c, "Failed to create user")
		return
	}

	response.Created(c, UserResponse{
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

// UpdateUser updates an existing user
func (h *UserHandler) UpdateUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "User not found")
		} else {
			response.InternalServerError(c, "Failed to fetch user")
		}
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	// Check if email already exists (if being changed)
	if req.Email != "" && req.Email != user.Email {
		var existingUser models.User
		if err := h.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
			response.Conflict(c, "Email already exists")
			return
		}
		user.Email = req.Email
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Role != "" {
		user.Role = models.UserRole(req.Role)
	}
	if req.CompanyCode != "" {
		user.CompanyCode = req.CompanyCode
	}
	if req.CostCenter != "" {
		user.CostCenter = req.CostCenter
	}
	if req.Department != "" {
		user.Department = req.Department
	}
	if req.Status != "" {
		user.Status = req.Status
	}

	if err := h.db.Save(&user).Error; err != nil {
		response.InternalServerError(c, "Failed to update user")
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

// DeleteUser deletes a user
func (h *UserHandler) DeleteUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	// Prevent self-deletion
	currentUserID := middleware.GetUserID(c)
	if uint(id) == currentUserID {
		response.BadRequest(c, "Cannot delete your own account")
		return
	}

	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "User not found")
		} else {
			response.InternalServerError(c, "Failed to fetch user")
		}
		return
	}

	if err := h.db.Delete(&user).Error; err != nil {
		response.InternalServerError(c, "Failed to delete user")
		return
	}

	response.SuccessWithMessage(c, "User deleted successfully", nil)
}

// ToggleUserStatus toggles user active/inactive status
func (h *UserHandler) ToggleUserStatus(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	// Prevent self-deactivation
	currentUserID := middleware.GetUserID(c)
	if uint(id) == currentUserID {
		response.BadRequest(c, "Cannot change your own status")
		return
	}

	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "User not found")
		} else {
			response.InternalServerError(c, "Failed to fetch user")
		}
		return
	}

	if user.Status == "active" {
		user.Status = "inactive"
	} else {
		user.Status = "active"
	}

	if err := h.db.Save(&user).Error; err != nil {
		response.InternalServerError(c, "Failed to update user status")
		return
	}

	response.SuccessWithMessage(c, "User status updated", UserResponse{
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

// ChangePassword changes the user's password
func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		response.NotFound(c, "User not found")
		return
	}

	// Verify current password
	if !services.VerifyPassword(req.CurrentPassword, user.PasswordHash) {
		response.Unauthorized(c, "Current password is incorrect")
		return
	}

	// Hash new password
	hashedPassword, err := services.HashPassword(req.NewPassword)
	if err != nil {
		response.InternalServerError(c, "Failed to hash password")
		return
	}

	user.PasswordHash = hashedPassword
	if err := h.db.Save(&user).Error; err != nil {
		response.InternalServerError(c, "Failed to update password")
		return
	}

	response.SuccessWithMessage(c, "Password changed successfully", nil)
}
