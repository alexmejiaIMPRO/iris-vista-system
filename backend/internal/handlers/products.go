package handlers

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"vista-backend/internal/models"
	"vista-backend/pkg/response"
)

type ProductHandler struct {
	db *gorm.DB
}

func NewProductHandler(db *gorm.DB) *ProductHandler {
	return &ProductHandler{db: db}
}

type ProductResponse struct {
	ID            uint                  `json:"id"`
	SKU           string                `json:"sku"`
	Name          string                `json:"name"`
	NameZh        string                `json:"name_zh"`
	NameEs        string                `json:"name_es"`
	Description   string                `json:"description"`
	Category      string                `json:"category"`
	Model         string                `json:"model"`
	Specification string                `json:"specification"`
	SpecZh        string                `json:"spec_zh"`
	SpecEs        string                `json:"spec_es"`
	Supplier      string                `json:"supplier"`
	SupplierCode  string                `json:"supplier_code"`
	Price         float64               `json:"price"`
	Currency      string                `json:"currency"`
	Stock         int                   `json:"stock"`
	MinStock      int                   `json:"min_stock"`
	MaxStock      int                   `json:"max_stock"`
	Location      string                `json:"location"`
	StockStatus   string                `json:"stock_status"`
	ImageURL      string                `json:"image_url"`
	ImageEmoji    string                `json:"image_emoji"`
	ClickUpID     string                `json:"clickup_id"`
	Source        string                `json:"source"`
	IsActive      bool                  `json:"is_active"`
	Images        []ProductImageResponse `json:"images,omitempty"`
}

type ProductImageResponse struct {
	ID        uint   `json:"id"`
	URL       string `json:"url"`
	SortOrder int    `json:"sort_order"`
	IsPrimary bool   `json:"is_primary"`
	Caption   string `json:"caption"`
}

type CreateProductRequest struct {
	SKU           string              `json:"sku" binding:"required"`
	Name          string              `json:"name" binding:"required"`
	NameZh        string              `json:"name_zh"`
	NameEs        string              `json:"name_es"`
	Description   string              `json:"description"`
	Category      string              `json:"category" binding:"required"`
	Model         string              `json:"model"`
	Specification string              `json:"specification"`
	SpecZh        string              `json:"spec_zh"`
	SpecEs        string              `json:"spec_es"`
	Supplier      string              `json:"supplier"`
	SupplierCode  string              `json:"supplier_code"`
	Price         float64             `json:"price" binding:"required,gte=0"`
	Currency      string              `json:"currency"`
	Stock         int                 `json:"stock" binding:"gte=0"`
	MinStock      int                 `json:"min_stock"`
	MaxStock      int                 `json:"max_stock"`
	Location      string              `json:"location"`
	ImageURL      string              `json:"image_url"`
	ImageEmoji    string              `json:"image_emoji"`
	ClickUpID     string              `json:"clickup_id"`
	Images        []ProductImageInput `json:"images"`
}

type ProductImageInput struct {
	URL       string `json:"url" binding:"required"`
	SortOrder int    `json:"sort_order"`
	IsPrimary bool   `json:"is_primary"`
	Caption   string `json:"caption"`
}

type UpdateProductRequest struct {
	Name          string              `json:"name"`
	NameZh        string              `json:"name_zh"`
	NameEs        string              `json:"name_es"`
	Description   string              `json:"description"`
	Category      string              `json:"category"`
	Model         string              `json:"model"`
	Specification string              `json:"specification"`
	SpecZh        string              `json:"spec_zh"`
	SpecEs        string              `json:"spec_es"`
	Supplier      string              `json:"supplier"`
	SupplierCode  string              `json:"supplier_code"`
	Price         float64             `json:"price" binding:"omitempty,gte=0"`
	Currency      string              `json:"currency"`
	Stock         *int                `json:"stock" binding:"omitempty,gte=0"`
	MinStock      *int                `json:"min_stock"`
	MaxStock      *int                `json:"max_stock"`
	Location      string              `json:"location"`
	ImageURL      string              `json:"image_url"`
	ImageEmoji    string              `json:"image_emoji"`
	ClickUpID     string              `json:"clickup_id"`
	IsActive      *bool               `json:"is_active"`
	Images        []ProductImageInput `json:"images"`
}

func productToResponse(p models.Product) ProductResponse {
	images := make([]ProductImageResponse, len(p.Images))
	for i, img := range p.Images {
		images[i] = ProductImageResponse{
			ID:        img.ID,
			URL:       img.URL,
			SortOrder: img.SortOrder,
			IsPrimary: img.IsPrimary,
			Caption:   img.Caption,
		}
	}

	return ProductResponse{
		ID:            p.ID,
		SKU:           p.SKU,
		Name:          p.Name,
		NameZh:        p.NameZh,
		NameEs:        p.NameEs,
		Description:   p.Description,
		Category:      p.Category,
		Model:         p.Model,
		Specification: p.Specification,
		SpecZh:        p.SpecZh,
		SpecEs:        p.SpecEs,
		Supplier:      p.Supplier,
		SupplierCode:  p.SupplierCode,
		Price:         p.Price,
		Currency:      p.Currency,
		Stock:         p.Stock,
		MinStock:      p.MinStock,
		MaxStock:      p.MaxStock,
		Location:      p.Location,
		StockStatus:   p.StockStatus(),
		ImageURL:      p.ImageURL,
		ImageEmoji:    p.ImageEmoji,
		ClickUpID:     p.ClickUpID,
		Source:        string(p.Source),
		IsActive:      p.IsActive,
		Images:        images,
	}
}

// ListProducts returns a list of products
func (h *ProductHandler) ListProducts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	search := c.Query("search")
	category := c.Query("category")
	supplier := c.Query("supplier")
	source := c.DefaultQuery("source", "internal")
	sortBy := c.DefaultQuery("sort", "name")
	sortOrder := c.DefaultQuery("order", "asc")

	offset := (page - 1) * perPage

	query := h.db.Model(&models.Product{}).Where("is_active = ?", true)

	// Filter by source
	if source != "" && source != "all" {
		query = query.Where("source = ?", source)
	}

	// Search
	if search != "" {
		searchTerm := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(model) LIKE ? OR LOWER(specification) LIKE ? OR LOWER(sku) LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm)
	}

	// Filter by category
	if category != "" && category != "all" {
		query = query.Where("category = ?", category)
	}

	// Filter by supplier
	if supplier != "" {
		query = query.Where("supplier = ?", supplier)
	}

	var total int64
	query.Count(&total)

	// Sorting
	orderClause := sortBy
	if sortOrder == "desc" {
		orderClause += " DESC"
	} else {
		orderClause += " ASC"
	}
	query = query.Order(orderClause)

	var products []models.Product
	if err := query.Preload("Images").Offset(offset).Limit(perPage).Find(&products).Error; err != nil {
		response.InternalServerError(c, "Failed to fetch products")
		return
	}

	productResponses := make([]ProductResponse, len(products))
	for i, product := range products {
		productResponses[i] = productToResponse(product)
	}

	response.SuccessWithMeta(c, productResponses, &response.Meta{
		Page:       page,
		PerPage:    perPage,
		Total:      total,
		TotalPages: response.CalculateTotalPages(total, perPage),
	})
}

// GetProduct returns a single product
func (h *ProductHandler) GetProduct(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid product ID")
		return
	}

	var product models.Product
	if err := h.db.Preload("Images").First(&product, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Product not found")
		} else {
			response.InternalServerError(c, "Failed to fetch product")
		}
		return
	}

	response.Success(c, productToResponse(product))
}

// GetCategories returns a list of unique categories
func (h *ProductHandler) GetCategories(c *gin.Context) {
	source := c.DefaultQuery("source", "internal")

	query := h.db.Model(&models.Product{}).Where("is_active = ?", true)
	if source != "" && source != "all" {
		query = query.Where("source = ?", source)
	}

	var categories []string
	if err := query.Distinct("category").Pluck("category", &categories).Error; err != nil {
		response.InternalServerError(c, "Failed to fetch categories")
		return
	}

	response.Success(c, categories)
}

// CreateProduct creates a new product
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	// Check if SKU already exists
	var existingProduct models.Product
	if err := h.db.Where("sku = ?", req.SKU).First(&existingProduct).Error; err == nil {
		response.Conflict(c, "SKU already exists")
		return
	}

	currency := req.Currency
	if currency == "" {
		currency = "USD"
	}

	product := models.Product{
		SKU:           req.SKU,
		Name:          req.Name,
		NameZh:        req.NameZh,
		NameEs:        req.NameEs,
		Description:   req.Description,
		Category:      req.Category,
		Model:         req.Model,
		Specification: req.Specification,
		SpecZh:        req.SpecZh,
		SpecEs:        req.SpecEs,
		Supplier:      req.Supplier,
		SupplierCode:  req.SupplierCode,
		Price:         req.Price,
		Currency:      currency,
		Stock:         req.Stock,
		MinStock:      req.MinStock,
		MaxStock:      req.MaxStock,
		Location:      req.Location,
		ImageURL:      req.ImageURL,
		ImageEmoji:    req.ImageEmoji,
		ClickUpID:     req.ClickUpID,
		Source:        models.SourceInternal,
		IsActive:      true,
	}

	if err := h.db.Create(&product).Error; err != nil {
		response.InternalServerError(c, "Failed to create product")
		return
	}

	// Create product images if provided
	if len(req.Images) > 0 {
		for _, imgInput := range req.Images {
			img := models.ProductImage{
				ProductID: product.ID,
				URL:       imgInput.URL,
				SortOrder: imgInput.SortOrder,
				IsPrimary: imgInput.IsPrimary,
				Caption:   imgInput.Caption,
			}
			h.db.Create(&img)
		}
		// Reload product with images
		h.db.Preload("Images").First(&product, product.ID)
	}

	response.Created(c, productToResponse(product))
}

// UpdateProduct updates an existing product
func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid product ID")
		return
	}

	var product models.Product
	if err := h.db.First(&product, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Product not found")
		} else {
			response.InternalServerError(c, "Failed to fetch product")
		}
		return
	}

	var req UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	if req.Name != "" {
		product.Name = req.Name
	}
	if req.NameZh != "" {
		product.NameZh = req.NameZh
	}
	if req.NameEs != "" {
		product.NameEs = req.NameEs
	}
	if req.Description != "" {
		product.Description = req.Description
	}
	if req.Category != "" {
		product.Category = req.Category
	}
	if req.Model != "" {
		product.Model = req.Model
	}
	if req.Specification != "" {
		product.Specification = req.Specification
	}
	if req.SpecZh != "" {
		product.SpecZh = req.SpecZh
	}
	if req.SpecEs != "" {
		product.SpecEs = req.SpecEs
	}
	if req.Supplier != "" {
		product.Supplier = req.Supplier
	}
	if req.SupplierCode != "" {
		product.SupplierCode = req.SupplierCode
	}
	if req.Price > 0 {
		product.Price = req.Price
	}
	if req.Currency != "" {
		product.Currency = req.Currency
	}
	if req.Stock != nil {
		product.Stock = *req.Stock
	}
	if req.MinStock != nil {
		product.MinStock = *req.MinStock
	}
	if req.MaxStock != nil {
		product.MaxStock = *req.MaxStock
	}
	if req.Location != "" {
		product.Location = req.Location
	}
	if req.ImageURL != "" {
		product.ImageURL = req.ImageURL
	}
	if req.ImageEmoji != "" {
		product.ImageEmoji = req.ImageEmoji
	}
	if req.ClickUpID != "" {
		product.ClickUpID = req.ClickUpID
	}
	if req.IsActive != nil {
		product.IsActive = *req.IsActive
	}

	if err := h.db.Save(&product).Error; err != nil {
		response.InternalServerError(c, "Failed to update product")
		return
	}

	// Update images if provided (replace all existing images)
	if req.Images != nil {
		// Delete existing images
		h.db.Where("product_id = ?", product.ID).Delete(&models.ProductImage{})
		// Create new images
		for _, imgInput := range req.Images {
			img := models.ProductImage{
				ProductID: product.ID,
				URL:       imgInput.URL,
				SortOrder: imgInput.SortOrder,
				IsPrimary: imgInput.IsPrimary,
				Caption:   imgInput.Caption,
			}
			h.db.Create(&img)
		}
	}

	// Reload product with images
	h.db.Preload("Images").First(&product, product.ID)
	response.Success(c, productToResponse(product))
}

// DeleteProduct deletes a product
func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid product ID")
		return
	}

	var product models.Product
	if err := h.db.First(&product, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Product not found")
		} else {
			response.InternalServerError(c, "Failed to fetch product")
		}
		return
	}

	if err := h.db.Delete(&product).Error; err != nil {
		response.InternalServerError(c, "Failed to delete product")
		return
	}

	response.SuccessWithMessage(c, "Product deleted successfully", nil)
}

// UpdateStock updates product stock
func (h *ProductHandler) UpdateStock(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid product ID")
		return
	}

	var req struct {
		Stock int `json:"stock" binding:"required,gte=0"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	var product models.Product
	if err := h.db.First(&product, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Product not found")
		} else {
			response.InternalServerError(c, "Failed to fetch product")
		}
		return
	}

	product.Stock = req.Stock
	if err := h.db.Save(&product).Error; err != nil {
		response.InternalServerError(c, "Failed to update stock")
		return
	}

	response.Success(c, productToResponse(product))
}
