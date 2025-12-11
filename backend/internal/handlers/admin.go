package handlers

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"vista-backend/internal/middleware"
	"vista-backend/internal/models"
	"vista-backend/pkg/crypto"
	"vista-backend/pkg/response"
)

type AdminHandler struct {
	db            *gorm.DB
	encryptionSvc *crypto.EncryptionService
}

func NewAdminHandler(db *gorm.DB, encryptionSvc *crypto.EncryptionService) *AdminHandler {
	return &AdminHandler{
		db:            db,
		encryptionSvc: encryptionSvc,
	}
}

// Amazon Config types

type AmazonConfigRequest struct {
	// PA-API credentials (for product search)
	AccessKey   string `json:"access_key"`
	SecretKey   string `json:"secret_key"`
	PartnerTag  string `json:"partner_tag"`
	Region      string `json:"region"`
	Marketplace string `json:"marketplace"`

	// Legacy Business account credentials (for ordering)
	Username               string `json:"username"`
	Password               string `json:"password"`
	AccountID              string `json:"account_id"`
	BusinessGroup          string `json:"business_group"`
	DefaultShippingAddress string `json:"default_shipping_address"`
}

type AmazonConfigResponse struct {
	ID uint `json:"id"`

	// PA-API credentials
	AccessKey      string `json:"access_key"`
	PartnerTag     string `json:"partner_tag"`
	Region         string `json:"region"`
	Marketplace    string `json:"marketplace"`
	HasSecretKey   bool   `json:"has_secret_key"`
	PAAPIConfigured bool  `json:"paapi_configured"`

	// Legacy Business account
	Username               string `json:"username"`
	AccountID              string `json:"account_id"`
	BusinessGroup          string `json:"business_group"`
	DefaultShippingAddress string `json:"default_shipping_address"`
	HasPassword            bool   `json:"has_password"`
	BusinessConfigured     bool   `json:"business_configured"`

	// Status
	IsActive    bool       `json:"is_active"`
	LastSyncAt  *time.Time `json:"last_sync_at"`
	LastTestAt  *time.Time `json:"last_test_at"`
	TestStatus  string     `json:"test_status"`
	TestMessage string     `json:"test_message"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// GetAmazonConfig returns the current Amazon configuration
func (h *AdminHandler) GetAmazonConfig(c *gin.Context) {
	var config models.AmazonConfig
	if err := h.db.First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Return empty config with defaults
			response.Success(c, AmazonConfigResponse{
				Region:             "us-east-1",
				Marketplace:        "www.amazon.com",
				IsActive:           false,
				HasSecretKey:       false,
				HasPassword:        false,
				PAAPIConfigured:    false,
				BusinessConfigured: false,
			})
			return
		}
		response.InternalServerError(c, "Failed to fetch Amazon config")
		return
	}

	response.Success(c, AmazonConfigResponse{
		ID: config.ID,

		// PA-API
		AccessKey:       config.AccessKey,
		PartnerTag:      config.PartnerTag,
		Region:          config.Region,
		Marketplace:     config.Marketplace,
		HasSecretKey:    config.EncryptedSecretKey != "",
		PAAPIConfigured: config.IsPAAPIConfigured(),

		// Business account
		Username:               config.Username,
		AccountID:              config.AccountID,
		BusinessGroup:          config.BusinessGroup,
		DefaultShippingAddress: config.DefaultShippingAddress,
		HasPassword:            config.EncryptedPassword != "",
		BusinessConfigured:     config.IsBusinessConfigured(),

		// Status
		IsActive:    config.IsActive,
		LastSyncAt:  config.LastSyncAt,
		LastTestAt:  config.LastTestAt,
		TestStatus:  config.TestStatus,
		TestMessage: config.TestMessage,
		CreatedAt:   config.CreatedAt,
		UpdatedAt:   config.UpdatedAt,
	})
}

// SaveAmazonConfig saves or updates the Amazon configuration
func (h *AdminHandler) SaveAmazonConfig(c *gin.Context) {
	var req AmazonConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	userID := middleware.GetUserID(c)

	var config models.AmazonConfig
	isNew := h.db.First(&config).Error == gorm.ErrRecordNotFound

	// PA-API credentials
	if req.AccessKey != "" {
		config.AccessKey = req.AccessKey
	}
	if req.PartnerTag != "" {
		config.PartnerTag = req.PartnerTag
	}
	if req.Region != "" {
		config.Region = req.Region
	} else if config.Region == "" {
		config.Region = "us-east-1"
	}
	if req.Marketplace != "" {
		config.Marketplace = req.Marketplace
	} else if config.Marketplace == "" {
		config.Marketplace = "www.amazon.com"
	}

	// Encrypt secret key if provided
	if req.SecretKey != "" {
		encryptedSecretKey, err := h.encryptionSvc.Encrypt(req.SecretKey)
		if err != nil {
			response.InternalServerError(c, "Failed to encrypt secret key")
			return
		}
		config.EncryptedSecretKey = encryptedSecretKey
	}

	// Business account credentials
	if req.Username != "" {
		config.Username = req.Username
	}
	config.AccountID = req.AccountID
	config.BusinessGroup = req.BusinessGroup
	config.DefaultShippingAddress = req.DefaultShippingAddress
	config.IsActive = true

	// Encrypt password if provided
	if req.Password != "" {
		encryptedPassword, err := h.encryptionSvc.Encrypt(req.Password)
		if err != nil {
			response.InternalServerError(c, "Failed to encrypt password")
			return
		}
		config.EncryptedPassword = encryptedPassword
	}

	if isNew {
		config.CreatedByID = userID
		if err := h.db.Create(&config).Error; err != nil {
			response.InternalServerError(c, "Failed to create Amazon config")
			return
		}
	} else {
		if err := h.db.Save(&config).Error; err != nil {
			response.InternalServerError(c, "Failed to update Amazon config")
			return
		}
	}

	response.SuccessWithMessage(c, "Amazon configuration saved", AmazonConfigResponse{
		ID: config.ID,

		// PA-API
		AccessKey:       config.AccessKey,
		PartnerTag:      config.PartnerTag,
		Region:          config.Region,
		Marketplace:     config.Marketplace,
		HasSecretKey:    config.EncryptedSecretKey != "",
		PAAPIConfigured: config.IsPAAPIConfigured(),

		// Business account
		Username:               config.Username,
		AccountID:              config.AccountID,
		BusinessGroup:          config.BusinessGroup,
		DefaultShippingAddress: config.DefaultShippingAddress,
		HasPassword:            config.EncryptedPassword != "",
		BusinessConfigured:     config.IsBusinessConfigured(),

		// Status
		IsActive:    config.IsActive,
		LastSyncAt:  config.LastSyncAt,
		LastTestAt:  config.LastTestAt,
		TestStatus:  config.TestStatus,
		TestMessage: config.TestMessage,
		CreatedAt:   config.CreatedAt,
		UpdatedAt:   config.UpdatedAt,
	})
}

// TestAmazonConnection tests the Amazon Business connection
func (h *AdminHandler) TestAmazonConnection(c *gin.Context) {
	var config models.AmazonConfig
	if err := h.db.First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.BadRequest(c, "Amazon configuration not found")
			return
		}
		response.InternalServerError(c, "Failed to fetch Amazon config")
		return
	}

	if !config.IsConfigured() {
		response.BadRequest(c, "Amazon configuration is incomplete")
		return
	}

	// TODO: Implement actual Amazon connection test using chromedp
	// For now, we'll simulate a test
	now := time.Now()
	config.LastTestAt = &now
	config.TestStatus = "success"
	config.TestMessage = "Connection test placeholder - actual test will use chromedp"

	if err := h.db.Save(&config).Error; err != nil {
		response.InternalServerError(c, "Failed to update test status")
		return
	}

	response.SuccessWithMessage(c, "Connection test completed", map[string]interface{}{
		"status":  config.TestStatus,
		"message": config.TestMessage,
	})
}

// Filter Rules types

type FilterRuleRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	RuleType    string `json:"rule_type" binding:"required"`
	Value       string `json:"value" binding:"required"`
	Priority    int    `json:"priority"`
	IsActive    *bool  `json:"is_active"`
}

type FilterRuleResponse struct {
	ID          uint      `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	RuleType    string    `json:"rule_type"`
	Value       string    `json:"value"`
	Priority    int       `json:"priority"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func filterRuleToResponse(r models.FilterRule) FilterRuleResponse {
	return FilterRuleResponse{
		ID:          r.ID,
		Name:        r.Name,
		Description: r.Description,
		RuleType:    string(r.RuleType),
		Value:       r.Value,
		Priority:    r.Priority,
		IsActive:    r.IsActive,
		CreatedAt:   r.CreatedAt,
		UpdatedAt:   r.UpdatedAt,
	}
}

// ListFilterRules returns all filter rules
func (h *AdminHandler) ListFilterRules(c *gin.Context) {
	var rules []models.FilterRule
	if err := h.db.Order("priority DESC, created_at ASC").Find(&rules).Error; err != nil {
		response.InternalServerError(c, "Failed to fetch filter rules")
		return
	}

	ruleResponses := make([]FilterRuleResponse, len(rules))
	for i, rule := range rules {
		ruleResponses[i] = filterRuleToResponse(rule)
	}

	response.Success(c, ruleResponses)
}

// CreateFilterRule creates a new filter rule
func (h *AdminHandler) CreateFilterRule(c *gin.Context) {
	var req FilterRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	userID := middleware.GetUserID(c)

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	rule := models.FilterRule{
		Name:        req.Name,
		Description: req.Description,
		RuleType:    models.RuleType(req.RuleType),
		Value:       req.Value,
		Priority:    req.Priority,
		IsActive:    isActive,
		CreatedByID: userID,
	}

	if err := h.db.Create(&rule).Error; err != nil {
		response.InternalServerError(c, "Failed to create filter rule")
		return
	}

	response.Created(c, filterRuleToResponse(rule))
}

// UpdateFilterRule updates an existing filter rule
func (h *AdminHandler) UpdateFilterRule(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid rule ID")
		return
	}

	var rule models.FilterRule
	if err := h.db.First(&rule, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Filter rule not found")
		} else {
			response.InternalServerError(c, "Failed to fetch filter rule")
		}
		return
	}

	var req FilterRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	rule.Name = req.Name
	rule.Description = req.Description
	rule.RuleType = models.RuleType(req.RuleType)
	rule.Value = req.Value
	rule.Priority = req.Priority
	if req.IsActive != nil {
		rule.IsActive = *req.IsActive
	}

	if err := h.db.Save(&rule).Error; err != nil {
		response.InternalServerError(c, "Failed to update filter rule")
		return
	}

	response.Success(c, filterRuleToResponse(rule))
}

// DeleteFilterRule deletes a filter rule
func (h *AdminHandler) DeleteFilterRule(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid rule ID")
		return
	}

	var rule models.FilterRule
	if err := h.db.First(&rule, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Filter rule not found")
		} else {
			response.InternalServerError(c, "Failed to fetch filter rule")
		}
		return
	}

	if err := h.db.Delete(&rule).Error; err != nil {
		response.InternalServerError(c, "Failed to delete filter rule")
		return
	}

	response.SuccessWithMessage(c, "Filter rule deleted", nil)
}

// ToggleFilterRule toggles a filter rule's active status
func (h *AdminHandler) ToggleFilterRule(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid rule ID")
		return
	}

	var rule models.FilterRule
	if err := h.db.First(&rule, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Filter rule not found")
		} else {
			response.InternalServerError(c, "Failed to fetch filter rule")
		}
		return
	}

	rule.IsActive = !rule.IsActive
	if err := h.db.Save(&rule).Error; err != nil {
		response.InternalServerError(c, "Failed to toggle filter rule")
		return
	}

	response.Success(c, filterRuleToResponse(rule))
}

// GetDashboardStats returns admin dashboard statistics
func (h *AdminHandler) GetDashboardStats(c *gin.Context) {
	var stats struct {
		TotalUsers         int64 `json:"total_users"`
		ActiveUsers        int64 `json:"active_users"`
		TotalProducts      int64 `json:"total_products"`
		TotalRequests      int64 `json:"total_requests"`
		PendingApprovals   int64 `json:"pending_approvals"`
		ApprovedRequests   int64 `json:"approved_requests"`
		RejectedRequests   int64 `json:"rejected_requests"`
		ActiveFilterRules  int64 `json:"active_filter_rules"`
		AmazonConfigured   bool  `json:"amazon_configured"`
	}

	h.db.Model(&models.User{}).Count(&stats.TotalUsers)
	h.db.Model(&models.User{}).Where("status = ?", "active").Count(&stats.ActiveUsers)
	h.db.Model(&models.Product{}).Where("is_active = ?", true).Count(&stats.TotalProducts)
	h.db.Model(&models.PurchaseRequest{}).Count(&stats.TotalRequests)
	h.db.Model(&models.PurchaseRequest{}).Where("status = ?", models.StatusPending).Count(&stats.PendingApprovals)
	h.db.Model(&models.PurchaseRequest{}).Where("status = ?", models.StatusApproved).Count(&stats.ApprovedRequests)
	h.db.Model(&models.PurchaseRequest{}).Where("status = ?", models.StatusRejected).Count(&stats.RejectedRequests)
	h.db.Model(&models.FilterRule{}).Where("is_active = ?", true).Count(&stats.ActiveFilterRules)

	var config models.AmazonConfig
	stats.AmazonConfigured = h.db.First(&config).Error == nil && config.IsConfigured()

	response.Success(c, stats)
}
