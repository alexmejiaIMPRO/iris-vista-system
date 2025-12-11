package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"vista-backend/internal/amazon"
	"vista-backend/internal/models"
	"vista-backend/pkg/crypto"
	"vista-backend/pkg/response"
)

type AmazonHandler struct {
	db            *gorm.DB
	encryptionSvc *crypto.EncryptionService
	manager       *amazon.AutomationManager
	scraper       *amazon.Scraper
}

func NewAmazonHandler(db *gorm.DB, encryptionSvc *crypto.EncryptionService) *AmazonHandler {
	manager := amazon.GetManager()
	return &AmazonHandler{
		db:            db,
		encryptionSvc: encryptionSvc,
		manager:       manager,
		scraper:       amazon.NewScraper(manager),
	}
}

// getPAAPIClient creates a PA-API client from the database configuration
func (h *AmazonHandler) getPAAPIClient() (*amazon.PAAPIClient, error) {
	var config models.AmazonConfig
	if err := h.db.First(&config).Error; err != nil {
		return nil, err
	}

	if !config.IsPAAPIConfigured() {
		return nil, nil // PA-API not configured
	}

	// Decrypt secret key
	secretKey, err := h.encryptionSvc.Decrypt(config.EncryptedSecretKey)
	if err != nil {
		return nil, err
	}

	return amazon.NewPAAPIClient(
		config.AccessKey,
		secretKey,
		config.PartnerTag,
		config.Region,
		config.Marketplace,
	), nil
}

// SearchProductsRequest represents a search request
type SearchProductsRequest struct {
	Query    string  `form:"q" binding:"required"`
	Category string  `form:"category"`
	MinPrice float64 `form:"min_price"`
	MaxPrice float64 `form:"max_price"`
	Page     int     `form:"page"`
	SortBy   string  `form:"sort_by"`
}

// AmazonProductResponse maps Amazon products to our API response format
type AmazonProductResponse struct {
	ID            int     `json:"id"`
	SKU           string  `json:"sku"`
	ASIN          string  `json:"asin"`
	Name          string  `json:"name"`
	Description   string  `json:"description"`
	Category      string  `json:"category"`
	Specification string  `json:"specification"`
	Supplier      string  `json:"supplier"`
	Price         float64 `json:"price"`
	Currency      string  `json:"currency"`
	Stock         int     `json:"stock"`
	StockStatus   string  `json:"stock_status"`
	ImageURL      string  `json:"image_url"`
	ProductURL    string  `json:"product_url"`
	Source        string  `json:"source"`
	IsActive      bool    `json:"is_active"`
	Rating        float64 `json:"rating"`
	ReviewCount   int     `json:"review_count"`
	IsPrime       bool    `json:"is_prime"`
	IsBestSeller  bool    `json:"is_best_seller"`
}

// SearchProducts searches Amazon for products using PA-API
func (h *AmazonHandler) SearchProducts(c *gin.Context) {
	var req SearchProductsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response.BadRequest(c, "Invalid request: query parameter 'q' is required")
		return
	}

	if req.Page < 1 {
		req.Page = 1
	}

	// Load active filter rules for price limits
	var filterRules []models.FilterRule
	h.db.Where("is_active = ?", true).Find(&filterRules)

	// Apply filter rule price limits if not specified in request
	for _, rule := range filterRules {
		switch rule.RuleType {
		case models.RulePriceMax:
			if req.MaxPrice == 0 {
				if v, err := strconv.ParseFloat(rule.Value, 64); err == nil {
					req.MaxPrice = v
				}
			}
		case models.RulePriceMin:
			if req.MinPrice == 0 {
				if v, err := strconv.ParseFloat(rule.Value, 64); err == nil {
					req.MinPrice = v
				}
			}
		}
	}

	// Try PA-API first
	paapiClient, err := h.getPAAPIClient()
	if err != nil {
		response.InternalServerError(c, "Failed to get Amazon configuration: "+err.Error())
		return
	}

	if paapiClient == nil {
		response.BadRequest(c, "Amazon PA-API not configured. Please configure PA-API credentials in Admin settings.")
		return
	}

	// Perform search via PA-API
	params := amazon.SearchParams{
		Query:    req.Query,
		Category: req.Category,
		MinPrice: req.MinPrice,
		MaxPrice: req.MaxPrice,
		Page:     req.Page,
		SortBy:   req.SortBy,
	}

	result, err := paapiClient.SearchProducts(params)
	if err != nil {
		response.InternalServerError(c, "PA-API search failed: "+err.Error())
		return
	}

	// Apply post-search filters (blocked categories, suppliers, keywords)
	filteredProducts := h.applyPostSearchFilters(result.Products, filterRules)

	// Convert to response format
	products := make([]AmazonProductResponse, len(filteredProducts))
	for i, p := range filteredProducts {
		stockStatus := "in_stock"
		if p.Availability != "" && p.Availability != "In Stock" {
			stockStatus = "limited"
		}

		products[i] = AmazonProductResponse{
			ID:            i + 1000,
			SKU:           "AMZ-" + p.ASIN,
			ASIN:          p.ASIN,
			Name:          p.Title,
			Description:   p.Title,
			Category:      p.Category,
			Specification: p.Specification,
			Supplier:      p.Supplier,
			Price:         p.Price,
			Currency:      p.Currency,
			Stock:         100,
			StockStatus:   stockStatus,
			ImageURL:      p.ImageURL,
			ProductURL:    p.ProductURL,
			Source:        "amazon",
			IsActive:      true,
			Rating:        p.Rating,
			ReviewCount:   p.ReviewCount,
			IsPrime:       p.IsPrime,
			IsBestSeller:  false,
		}
	}

	response.Success(c, map[string]interface{}{
		"products":    products,
		"total_count": result.TotalCount,
		"page":        result.Page,
		"has_more":    result.HasMore,
		"source":      "pa-api",
	})
}

// applyPostSearchFilters filters products based on blocked categories, suppliers, and keywords
func (h *AmazonHandler) applyPostSearchFilters(products []amazon.AmazonProduct, rules []models.FilterRule) []amazon.AmazonProduct {
	blockedCategories := make(map[string]bool)
	blockedSuppliers := make(map[string]bool)
	blockedKeywords := make([]string, 0)

	for _, rule := range rules {
		switch rule.RuleType {
		case models.RuleCategoryBlock:
			blockedCategories[rule.Value] = true
		case models.RuleSupplierBlock:
			blockedSuppliers[rule.Value] = true
		case models.RuleKeywordBlock:
			blockedKeywords = append(blockedKeywords, rule.Value)
		}
	}

	filtered := make([]amazon.AmazonProduct, 0, len(products))
	for _, p := range products {
		// Check blocked category
		if blockedCategories[p.Category] {
			continue
		}

		// Check blocked supplier
		if blockedSuppliers[p.Supplier] {
			continue
		}

		// Check blocked keywords in title
		blocked := false
		for _, kw := range blockedKeywords {
			if containsIgnoreCase(p.Title, kw) {
				blocked = true
				break
			}
		}
		if blocked {
			continue
		}

		filtered = append(filtered, p)
	}

	return filtered
}

// containsIgnoreCase checks if s contains substr (case-insensitive)
func containsIgnoreCase(s, substr string) bool {
	return len(s) >= len(substr) &&
		(s == substr ||
		len(substr) == 0 ||
		findIgnoreCase(s, substr))
}

func findIgnoreCase(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if equalFoldSlice(s[i:i+len(substr)], substr) {
			return true
		}
	}
	return false
}

func equalFoldSlice(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := 0; i < len(a); i++ {
		ca, cb := a[i], b[i]
		if ca >= 'A' && ca <= 'Z' {
			ca += 'a' - 'A'
		}
		if cb >= 'A' && cb <= 'Z' {
			cb += 'a' - 'A'
		}
		if ca != cb {
			return false
		}
	}
	return true
}

// GetProductDetails gets detailed information about a specific Amazon product
func (h *AmazonHandler) GetProductDetails(c *gin.Context) {
	asin := c.Param("asin")
	if asin == "" {
		response.BadRequest(c, "ASIN is required")
		return
	}

	// Get PA-API client
	paapiClient, err := h.getPAAPIClient()
	if err != nil {
		response.InternalServerError(c, "Failed to get Amazon configuration: "+err.Error())
		return
	}

	if paapiClient == nil {
		response.BadRequest(c, "Amazon PA-API not configured. Please configure PA-API credentials in Admin settings.")
		return
	}

	product, err := paapiClient.GetItem(asin)
	if err != nil {
		response.InternalServerError(c, "Failed to fetch product details: "+err.Error())
		return
	}

	stockStatus := "in_stock"
	if product.Availability != "" && product.Availability != "In Stock" {
		stockStatus = "limited"
	}

	response.Success(c, AmazonProductResponse{
		ID:            1000,
		SKU:           "AMZ-" + product.ASIN,
		ASIN:          product.ASIN,
		Name:          product.Title,
		Description:   product.Title,
		Category:      product.Category,
		Specification: product.Specification,
		Supplier:      product.Supplier,
		Price:         product.Price,
		Currency:      product.Currency,
		Stock:         100,
		StockStatus:   stockStatus,
		ImageURL:      product.ImageURL,
		ProductURL:    product.ProductURL,
		Source:        "amazon",
		IsActive:      true,
		Rating:        product.Rating,
		ReviewCount:   product.ReviewCount,
		IsPrime:       product.IsPrime,
		IsBestSeller:  false,
	})
}

// GetSessionStatus returns the current Amazon session status
func (h *AmazonHandler) GetSessionStatus(c *gin.Context) {
	info := h.manager.GetSessionInfo()
	response.Success(c, info)
}

// Initialize initializes the browser for Amazon scraping
func (h *AmazonHandler) Initialize(c *gin.Context) {
	// Load config from database
	var config models.AmazonConfig
	if err := h.db.First(&config).Error; err != nil {
		response.BadRequest(c, "Amazon not configured")
		return
	}

	// Decrypt password
	password, err := h.encryptionSvc.Decrypt(config.EncryptedPassword)
	if err != nil {
		response.InternalServerError(c, "Failed to decrypt credentials")
		return
	}

	// Configure manager
	h.manager.Configure(&amazon.Config{
		Username:            config.Username,
		Password:            password,
		AccountID:           config.AccountID,
		BusinessGroup:       config.BusinessGroup,
		DefaultShippingAddr: config.DefaultShippingAddress,
		Headless:            true,
	})

	// Initialize browser
	if err := h.manager.Initialize(); err != nil {
		response.InternalServerError(c, "Failed to initialize browser: "+err.Error())
		return
	}

	response.SuccessWithMessage(c, "Browser initialized", nil)
}

// Login logs into Amazon Business
func (h *AmazonHandler) Login(c *gin.Context) {
	if err := h.manager.Login(); err != nil {
		response.InternalServerError(c, "Login failed: "+err.Error())
		return
	}

	response.SuccessWithMessage(c, "Logged in successfully", nil)
}

// GetFilteredCategories returns categories that are allowed based on filter rules
func (h *AmazonHandler) GetFilteredCategories(c *gin.Context) {
	var blockedCategories []string
	h.db.Model(&models.FilterRule{}).
		Where("is_active = ? AND rule_type = ?", true, "category_block").
		Pluck("value", &blockedCategories)

	// Default Amazon Business categories
	allCategories := []string{
		"Electronics",
		"Office Supplies",
		"Furniture",
		"Industrial & Scientific",
		"Computer Accessories",
		"Software",
		"Janitorial",
		"Safety Equipment",
	}

	// Filter out blocked categories
	allowedCategories := make([]string, 0)
	blockedMap := make(map[string]bool)
	for _, cat := range blockedCategories {
		blockedMap[cat] = true
	}

	for _, cat := range allCategories {
		if !blockedMap[cat] {
			allowedCategories = append(allowedCategories, cat)
		}
	}

	response.Success(c, allowedCategories)
}

// GetActiveFilters returns the active filter rules summary
func (h *AmazonHandler) GetActiveFilters(c *gin.Context) {
	var rules []models.FilterRule
	h.db.Where("is_active = ?", true).Find(&rules)

	summary := make(map[string]interface{})

	for _, rule := range rules {
		switch rule.RuleType {
		case models.RulePriceMax:
			if v, err := strconv.ParseFloat(rule.Value, 64); err == nil {
				summary["max_price"] = v
			}
		case models.RulePriceMin:
			if v, err := strconv.ParseFloat(rule.Value, 64); err == nil {
				summary["min_price"] = v
			}
		}
	}

	var blockedCategories []string
	h.db.Model(&models.FilterRule{}).
		Where("is_active = ? AND rule_type = ?", true, models.RuleCategoryBlock).
		Pluck("value", &blockedCategories)
	summary["blocked_categories"] = blockedCategories

	var blockedSuppliers []string
	h.db.Model(&models.FilterRule{}).
		Where("is_active = ? AND rule_type = ?", true, models.RuleSupplierBlock).
		Pluck("value", &blockedSuppliers)
	summary["blocked_suppliers"] = blockedSuppliers

	var blockedKeywords []string
	h.db.Model(&models.FilterRule{}).
		Where("is_active = ? AND rule_type = ?", true, models.RuleKeywordBlock).
		Pluck("value", &blockedKeywords)
	summary["blocked_keywords"] = blockedKeywords

	response.Success(c, summary)
}
