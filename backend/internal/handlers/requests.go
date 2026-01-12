package handlers

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"vista-backend/internal/middleware"
	"vista-backend/internal/models"
	"vista-backend/internal/services/amazon"
	"vista-backend/internal/services/metadata"
	"vista-backend/pkg/response"
)

type RequestHandler struct {
	db                *gorm.DB
	metadataExtractor *metadata.Extractor
}

func NewRequestHandler(db *gorm.DB) *RequestHandler {
	return &RequestHandler{
		db:                db,
		metadataExtractor: metadata.NewExtractor(),
	}
}

// CreateRequestInput represents the input for creating a new purchase request
type CreateRequestInput struct {
	URL           string   `json:"url" binding:"required,url"`
	Quantity      int      `json:"quantity" binding:"required,gte=1"`
	Justification string   `json:"justification" binding:"required"`
	Urgency       string   `json:"urgency" binding:"omitempty,oneof=normal urgent"`

	// Optional: User can override extracted metadata
	ProductTitle       string   `json:"product_title"`
	ProductImageURL    string   `json:"product_image_url"`
	ProductDescription string   `json:"product_description"`
	EstimatedPrice     *float64 `json:"estimated_price"`
	Currency           string   `json:"currency"`
}

// ExtractMetadataInput represents the input for metadata extraction
type ExtractMetadataInput struct {
	URL string `json:"url" binding:"required,url"`
}

// RequestResponse represents the response for a purchase request
type RequestResponse struct {
	ID                 uint          `json:"id"`
	RequestNumber      string        `json:"request_number"`
	URL                string        `json:"url"`
	ProductTitle       string        `json:"product_title"`
	ProductImageURL    string        `json:"product_image_url"`
	ProductDescription string        `json:"product_description"`
	EstimatedPrice     *float64      `json:"estimated_price,omitempty"`
	Currency           string        `json:"currency"`
	Quantity           int           `json:"quantity"`
	Justification      string        `json:"justification"`
	Urgency            string        `json:"urgency"`
	RequesterID        uint          `json:"requester_id"`
	Requester          *UserResponse `json:"requester,omitempty"`
	Status             string        `json:"status"`

	// Amazon specific
	IsAmazonURL   bool       `json:"is_amazon_url"`
	AddedToCart   bool       `json:"added_to_cart"`
	AddedToCartAt *time.Time `json:"added_to_cart_at,omitempty"`
	CartError     string     `json:"cart_error,omitempty"`
	AmazonASIN    string     `json:"amazon_asin,omitempty"`

	// Approval info
	ApprovedBy      *UserResponse `json:"approved_by,omitempty"`
	ApprovedAt      *time.Time    `json:"approved_at,omitempty"`
	RejectedBy      *UserResponse `json:"rejected_by,omitempty"`
	RejectedAt      *time.Time    `json:"rejected_at,omitempty"`
	RejectionReason string        `json:"rejection_reason,omitempty"`

	// Info request
	InfoRequestedAt *time.Time `json:"info_requested_at,omitempty"`
	InfoRequestNote string     `json:"info_request_note,omitempty"`

	// Purchase info
	PurchasedBy   *UserResponse `json:"purchased_by,omitempty"`
	PurchasedAt   *time.Time    `json:"purchased_at,omitempty"`
	PurchaseNotes string        `json:"purchase_notes,omitempty"`

	// History
	History []RequestHistoryResponse `json:"history,omitempty"`

	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type RequestHistoryResponse struct {
	ID        uint          `json:"id"`
	UserID    uint          `json:"user_id"`
	User      *UserResponse `json:"user,omitempty"`
	Action    string        `json:"action"`
	Comment   string        `json:"comment"`
	OldStatus string        `json:"old_status"`
	NewStatus string        `json:"new_status"`
	CreatedAt time.Time     `json:"created_at"`
}

func requestToResponse(r models.PurchaseRequest) RequestResponse {
	resp := RequestResponse{
		ID:                 r.ID,
		RequestNumber:      r.RequestNumber,
		URL:                r.URL,
		ProductTitle:       r.ProductTitle,
		ProductImageURL:    r.ProductImageURL,
		ProductDescription: r.ProductDescription,
		EstimatedPrice:     r.EstimatedPrice,
		Currency:           r.Currency,
		Quantity:           r.Quantity,
		Justification:      r.Justification,
		Urgency:            string(r.Urgency),
		RequesterID:        r.RequesterID,
		Status:             string(r.Status),
		IsAmazonURL:        r.IsAmazonURL,
		AddedToCart:        r.AddedToCart,
		AddedToCartAt:      r.AddedToCartAt,
		CartError:          r.CartError,
		AmazonASIN:         r.AmazonASIN,
		ApprovedAt:         r.ApprovedAt,
		RejectedAt:         r.RejectedAt,
		RejectionReason:    r.RejectionReason,
		InfoRequestedAt:    r.InfoRequestedAt,
		InfoRequestNote:    r.InfoRequestNote,
		PurchasedAt:        r.PurchasedAt,
		PurchaseNotes:      r.PurchaseNotes,
		CreatedAt:          r.CreatedAt,
		UpdatedAt:          r.UpdatedAt,
	}

	if r.Requester.ID != 0 {
		resp.Requester = &UserResponse{
			ID:          r.Requester.ID,
			Email:       r.Requester.Email,
			Name:        r.Requester.Name,
			Role:        string(r.Requester.Role),
			CompanyCode: r.Requester.CompanyCode,
			CostCenter:  r.Requester.CostCenter,
			Department:  r.Requester.Department,
			Status:      r.Requester.Status,
		}
	}

	if r.ApprovedBy != nil && r.ApprovedBy.ID != 0 {
		resp.ApprovedBy = &UserResponse{
			ID:    r.ApprovedBy.ID,
			Email: r.ApprovedBy.Email,
			Name:  r.ApprovedBy.Name,
			Role:  string(r.ApprovedBy.Role),
		}
	}

	if r.RejectedBy != nil && r.RejectedBy.ID != 0 {
		resp.RejectedBy = &UserResponse{
			ID:    r.RejectedBy.ID,
			Email: r.RejectedBy.Email,
			Name:  r.RejectedBy.Name,
			Role:  string(r.RejectedBy.Role),
		}
	}

	if r.PurchasedBy != nil && r.PurchasedBy.ID != 0 {
		resp.PurchasedBy = &UserResponse{
			ID:    r.PurchasedBy.ID,
			Email: r.PurchasedBy.Email,
			Name:  r.PurchasedBy.Name,
			Role:  string(r.PurchasedBy.Role),
		}
	}

	for _, h := range r.History {
		historyResp := RequestHistoryResponse{
			ID:        h.ID,
			UserID:    h.UserID,
			Action:    string(h.Action),
			Comment:   h.Comment,
			OldStatus: string(h.OldStatus),
			NewStatus: string(h.NewStatus),
			CreatedAt: h.CreatedAt,
		}
		if h.User.ID != 0 {
			historyResp.User = &UserResponse{
				ID:    h.User.ID,
				Email: h.User.Email,
				Name:  h.User.Name,
				Role:  string(h.User.Role),
			}
		}
		resp.History = append(resp.History, historyResp)
	}

	return resp
}

// ExtractMetadata extracts metadata from a URL (for preview before submission)
func (h *RequestHandler) ExtractMetadata(c *gin.Context) {
	var input ExtractMetadataInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	meta, err := h.metadataExtractor.ExtractFromURL(input.URL)
	if err != nil {
		// Return partial response even on error
		response.Success(c, gin.H{
			"url":          input.URL,
			"title":        "",
			"description":  "",
			"image_url":    "",
			"price":        nil,
			"currency":     "MXN",
			"site_name":    "",
			"is_amazon":    amazon.IsAmazonURL(input.URL),
			"amazon_asin":  amazon.ExtractASIN(input.URL),
			"error":        err.Error(),
		})
		return
	}

	response.Success(c, gin.H{
		"url":          input.URL,
		"title":        meta.Title,
		"description":  meta.Description,
		"image_url":    meta.ImageURL,
		"price":        meta.Price,
		"currency":     meta.Currency,
		"site_name":    meta.SiteName,
		"is_amazon":    amazon.IsAmazonURL(input.URL),
		"amazon_asin":  amazon.ExtractASIN(input.URL),
		"error":        nil,
	})
}

// CreateRequest creates a new purchase request
func (h *RequestHandler) CreateRequest(c *gin.Context) {
	var input CreateRequestInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	userID := middleware.GetUserID(c)

	// Try to extract metadata if not provided
	productTitle := input.ProductTitle
	productImageURL := input.ProductImageURL
	productDescription := input.ProductDescription
	estimatedPrice := input.EstimatedPrice
	currency := input.Currency

	if productTitle == "" || productImageURL == "" {
		meta, err := h.metadataExtractor.ExtractFromURL(input.URL)
		if err == nil {
			if productTitle == "" {
				productTitle = meta.Title
			}
			if productImageURL == "" {
				productImageURL = meta.ImageURL
			}
			if productDescription == "" {
				productDescription = meta.Description
			}
			if estimatedPrice == nil && meta.Price != nil {
				estimatedPrice = meta.Price
			}
			if currency == "" && meta.Currency != "" {
				currency = meta.Currency
			}
		}
	}

	if currency == "" {
		currency = "MXN"
	}

	urgency := models.UrgencyNormal
	if input.Urgency == "urgent" {
		urgency = models.UrgencyUrgent
	}

	// Check if it's an Amazon URL
	isAmazonURL := amazon.IsAmazonURL(input.URL)
	amazonASIN := ""
	if isAmazonURL {
		amazonASIN = amazon.ExtractASIN(input.URL)
	}

	request := models.PurchaseRequest{
		RequestNumber:      models.GenerateRequestNumber(h.db),
		URL:                input.URL,
		ProductTitle:       productTitle,
		ProductImageURL:    productImageURL,
		ProductDescription: productDescription,
		EstimatedPrice:     estimatedPrice,
		Currency:           currency,
		Quantity:           input.Quantity,
		Justification:      input.Justification,
		Urgency:            urgency,
		RequesterID:        userID,
		Status:             models.StatusPending,
		IsAmazonURL:        isAmazonURL,
		AmazonASIN:         amazonASIN,
	}

	err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&request).Error; err != nil {
			return err
		}

		history := models.NewHistory(request.ID, userID, models.ActionCreated, "", models.StatusPending, "Purchase request created")
		return tx.Create(history).Error
	})

	if err != nil {
		response.InternalServerError(c, "Failed to create request")
		return
	}

	// Reload with relations
	h.db.
		Preload("Requester").
		Preload("History").
		Preload("History.User").
		First(&request, request.ID)

	response.Created(c, requestToResponse(request))
}

// ListRequests returns a list of requests
func (h *RequestHandler) ListRequests(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	status := c.Query("status")

	offset := (page - 1) * perPage
	userID := middleware.GetUserID(c)
	canViewAll := middleware.CanViewAll(c)

	query := h.db.Model(&models.PurchaseRequest{}).
		Preload("Requester")

	if !canViewAll {
		query = query.Where("requester_id = ?", userID)
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var requests []models.PurchaseRequest
	if err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&requests).Error; err != nil {
		response.InternalServerError(c, "Failed to fetch requests")
		return
	}

	requestResponses := make([]RequestResponse, len(requests))
	for i, req := range requests {
		requestResponses[i] = requestToResponse(req)
	}

	response.SuccessWithMeta(c, requestResponses, &response.Meta{
		Page:       page,
		PerPage:    perPage,
		Total:      total,
		TotalPages: response.CalculateTotalPages(total, perPage),
	})
}

// GetRequest returns a single request
func (h *RequestHandler) GetRequest(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid request ID")
		return
	}

	var req models.PurchaseRequest
	if err := h.db.
		Preload("Requester").
		Preload("History").
		Preload("History.User").
		Preload("ApprovedBy").
		Preload("RejectedBy").
		Preload("PurchasedBy").
		First(&req, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Request not found")
		} else {
			response.InternalServerError(c, "Failed to fetch request")
		}
		return
	}

	userID := middleware.GetUserID(c)
	canViewAll := middleware.CanViewAll(c)
	if !canViewAll && req.RequesterID != userID {
		response.Forbidden(c, "Access denied")
		return
	}

	response.Success(c, requestToResponse(req))
}

// GetMyRequests returns the current user's requests
func (h *RequestHandler) GetMyRequests(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	status := c.Query("status")

	offset := (page - 1) * perPage
	userID := middleware.GetUserID(c)

	query := h.db.Model(&models.PurchaseRequest{}).
		Where("requester_id = ?", userID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var requests []models.PurchaseRequest
	if err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&requests).Error; err != nil {
		response.InternalServerError(c, "Failed to fetch requests")
		return
	}

	requestResponses := make([]RequestResponse, len(requests))
	for i, req := range requests {
		requestResponses[i] = requestToResponse(req)
	}

	response.SuccessWithMeta(c, requestResponses, &response.Meta{
		Page:       page,
		PerPage:    perPage,
		Total:      total,
		TotalPages: response.CalculateTotalPages(total, perPage),
	})
}

// CancelRequest cancels a pending request
func (h *RequestHandler) CancelRequest(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid request ID")
		return
	}

	userID := middleware.GetUserID(c)

	var request models.PurchaseRequest
	if err := h.db.First(&request, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Request not found")
		} else {
			response.InternalServerError(c, "Failed to fetch request")
		}
		return
	}

	if request.RequesterID != userID {
		response.Forbidden(c, "Access denied")
		return
	}

	if !request.CanBeCancelled() {
		response.BadRequest(c, "Request cannot be cancelled")
		return
	}

	oldStatus := request.Status
	request.Status = models.StatusRejected

	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&request).Error; err != nil {
			return err
		}

		history := models.NewHistory(request.ID, userID, models.ActionCancelled, oldStatus, models.StatusRejected, "Request cancelled by requester")
		return tx.Create(history).Error
	})

	if err != nil {
		response.InternalServerError(c, "Failed to cancel request")
		return
	}

	response.SuccessWithMessage(c, "Request cancelled successfully", nil)
}

// UpdateRequest allows the requester to update their pending request
func (h *RequestHandler) UpdateRequest(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid request ID")
		return
	}

	userID := middleware.GetUserID(c)

	var request models.PurchaseRequest
	if err := h.db.First(&request, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Request not found")
		} else {
			response.InternalServerError(c, "Failed to fetch request")
		}
		return
	}

	if request.RequesterID != userID {
		response.Forbidden(c, "Access denied")
		return
	}

	// Can only update if pending or info_requested
	if request.Status != models.StatusPending && request.Status != models.StatusInfoRequested {
		response.BadRequest(c, "Request cannot be updated in current status")
		return
	}

	var input struct {
		Quantity           int      `json:"quantity"`
		Justification      string   `json:"justification"`
		Urgency            string   `json:"urgency"`
		ProductTitle       string   `json:"product_title"`
		ProductDescription string   `json:"product_description"`
		EstimatedPrice     *float64 `json:"estimated_price"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	// Update fields if provided
	if input.Quantity > 0 {
		request.Quantity = input.Quantity
	}
	if input.Justification != "" {
		request.Justification = input.Justification
	}
	if input.Urgency != "" {
		if input.Urgency == "urgent" {
			request.Urgency = models.UrgencyUrgent
		} else {
			request.Urgency = models.UrgencyNormal
		}
	}
	if input.ProductTitle != "" {
		request.ProductTitle = input.ProductTitle
	}
	if input.ProductDescription != "" {
		request.ProductDescription = input.ProductDescription
	}
	if input.EstimatedPrice != nil {
		request.EstimatedPrice = input.EstimatedPrice
	}

	// If status was info_requested, change back to pending
	if request.Status == models.StatusInfoRequested {
		request.Status = models.StatusPending
	}

	if err := h.db.Save(&request).Error; err != nil {
		response.InternalServerError(c, "Failed to update request")
		return
	}

	// Reload with relations
	h.db.
		Preload("Requester").
		Preload("History").
		Preload("History.User").
		First(&request, request.ID)

	response.Success(c, requestToResponse(request))
}
