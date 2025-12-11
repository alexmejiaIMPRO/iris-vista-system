package handlers

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"vista-backend/internal/middleware"
	"vista-backend/internal/models"
	"vista-backend/pkg/response"
)

type RequestHandler struct {
	db *gorm.DB
}

func NewRequestHandler(db *gorm.DB) *RequestHandler {
	return &RequestHandler{db: db}
}

type RequestItemInput struct {
	ProductID     *uint   `json:"product_id"`
	AmazonASIN    string  `json:"amazon_asin"`
	Name          string  `json:"name" binding:"required"`
	Specification string  `json:"specification"`
	Quantity      int     `json:"quantity" binding:"required,gte=1"`
	UnitPrice     float64 `json:"unit_price" binding:"required,gte=0"`
	Supplier      string  `json:"supplier"`
	Source        string  `json:"source" binding:"required,oneof=internal amazon"`
	ImageURL      string  `json:"image_url"`
}

type CreateRequestInput struct {
	Type       string             `json:"type" binding:"required,oneof=material_issue purchase_requisition"`
	CostCenter string             `json:"cost_center" binding:"required"`
	Purpose    string             `json:"purpose"`
	Notes      string             `json:"notes"`
	Priority   string             `json:"priority" binding:"omitempty,oneof=low normal high urgent"`
	Items      []RequestItemInput `json:"items" binding:"required,min=1"`
}

type RequestResponse struct {
	ID              uint                   `json:"id"`
	RequestNumber   string                 `json:"request_number"`
	RequesterID     uint                   `json:"requester_id"`
	Requester       *UserResponse          `json:"requester,omitempty"`
	Status          string                 `json:"status"`
	Type            string                 `json:"type"`
	TotalAmount     float64                `json:"total_amount"`
	Currency        string                 `json:"currency"`
	CostCenter      string                 `json:"cost_center"`
	Purpose         string                 `json:"purpose"`
	Notes           string                 `json:"notes"`
	Priority        string                 `json:"priority"`
	Items           []RequestItemResponse  `json:"items,omitempty"`
	History         []RequestHistoryResponse `json:"history,omitempty"`
	ApprovedBy      *UserResponse          `json:"approved_by,omitempty"`
	ApprovedAt      *time.Time             `json:"approved_at,omitempty"`
	RejectedBy      *UserResponse          `json:"rejected_by,omitempty"`
	RejectedAt      *time.Time             `json:"rejected_at,omitempty"`
	RejectionReason string                 `json:"rejection_reason,omitempty"`
	AmazonOrderID   *uint                  `json:"amazon_order_id,omitempty"`
	CreatedAt       time.Time              `json:"created_at"`
	UpdatedAt       time.Time              `json:"updated_at"`
}

type RequestItemResponse struct {
	ID            uint    `json:"id"`
	ProductID     *uint   `json:"product_id,omitempty"`
	AmazonASIN    string  `json:"amazon_asin,omitempty"`
	Name          string  `json:"name"`
	Specification string  `json:"specification"`
	Quantity      int     `json:"quantity"`
	UnitPrice     float64 `json:"unit_price"`
	TotalPrice    float64 `json:"total_price"`
	Supplier      string  `json:"supplier"`
	Source        string  `json:"source"`
	ImageURL      string  `json:"image_url"`
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
		ID:              r.ID,
		RequestNumber:   r.RequestNumber,
		RequesterID:     r.RequesterID,
		Status:          string(r.Status),
		Type:            string(r.Type),
		TotalAmount:     r.TotalAmount,
		Currency:        r.Currency,
		CostCenter:      r.CostCenter,
		Purpose:         r.Purpose,
		Notes:           r.Notes,
		Priority:        r.Priority,
		ApprovedAt:      r.ApprovedAt,
		RejectedAt:      r.RejectedAt,
		RejectionReason: r.RejectionReason,
		AmazonOrderID:   r.AmazonOrderID,
		CreatedAt:       r.CreatedAt,
		UpdatedAt:       r.UpdatedAt,
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

	for _, item := range r.Items {
		resp.Items = append(resp.Items, RequestItemResponse{
			ID:            item.ID,
			ProductID:     item.ProductID,
			AmazonASIN:    item.AmazonASIN,
			Name:          item.Name,
			Specification: item.Specification,
			Quantity:      item.Quantity,
			UnitPrice:     item.UnitPrice,
			TotalPrice:    item.TotalPrice,
			Supplier:      item.Supplier,
			Source:        string(item.Source),
			ImageURL:      item.ImageURL,
		})
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

// ListRequests returns a list of requests
func (h *RequestHandler) ListRequests(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	status := c.Query("status")
	requestType := c.Query("type")

	offset := (page - 1) * perPage
	userID := middleware.GetUserID(c)
	canViewAll := middleware.CanViewAll(c)

	query := h.db.Model(&models.PurchaseRequest{}).
		Preload("Requester").
		Preload("Items")

	// If user can't view all, only show their own requests
	if !canViewAll {
		query = query.Where("requester_id = ?", userID)
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if requestType != "" {
		query = query.Where("type = ?", requestType)
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
		Preload("Items").
		Preload("History").
		Preload("History.User").
		Preload("ApprovedBy").
		Preload("RejectedBy").
		First(&req, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Request not found")
		} else {
			response.InternalServerError(c, "Failed to fetch request")
		}
		return
	}

	// Check access
	userID := middleware.GetUserID(c)
	canViewAll := middleware.CanViewAll(c)
	if !canViewAll && req.RequesterID != userID {
		response.Forbidden(c, "Access denied")
		return
	}

	response.Success(c, requestToResponse(req))
}

// CreateRequest creates a new purchase request
func (h *RequestHandler) CreateRequest(c *gin.Context) {
	var input CreateRequestInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	userID := middleware.GetUserID(c)

	// Calculate total amount
	var totalAmount float64
	items := make([]models.RequestItem, len(input.Items))
	for i, item := range input.Items {
		totalPrice := float64(item.Quantity) * item.UnitPrice
		totalAmount += totalPrice
		items[i] = models.RequestItem{
			ProductID:     item.ProductID,
			AmazonASIN:    item.AmazonASIN,
			Name:          item.Name,
			Specification: item.Specification,
			Quantity:      item.Quantity,
			UnitPrice:     item.UnitPrice,
			TotalPrice:    totalPrice,
			Supplier:      item.Supplier,
			Source:        models.ProductSource(item.Source),
			ImageURL:      item.ImageURL,
		}
	}

	priority := input.Priority
	if priority == "" {
		priority = "normal"
	}

	request := models.PurchaseRequest{
		RequestNumber: models.GenerateRequestNumber(h.db),
		RequesterID:   userID,
		Status:        models.StatusPending,
		Type:          models.RequestType(input.Type),
		TotalAmount:   totalAmount,
		Currency:      "USD",
		CostCenter:    input.CostCenter,
		Purpose:       input.Purpose,
		Notes:         input.Notes,
		Priority:      priority,
		Items:         items,
	}

	// Create request with items in a transaction
	err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&request).Error; err != nil {
			return err
		}

		// Add history entry
		history := models.NewHistory(request.ID, userID, models.ActionCreated, "", models.StatusPending, "Request created")
		return tx.Create(history).Error
	})

	if err != nil {
		response.InternalServerError(c, "Failed to create request")
		return
	}

	// Reload with relations
	h.db.
		Preload("Requester").
		Preload("Items").
		Preload("History").
		Preload("History.User").
		First(&request, request.ID)

	response.Created(c, requestToResponse(request))
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

	// Check ownership
	if request.RequesterID != userID {
		response.Forbidden(c, "Access denied")
		return
	}

	// Check if can be cancelled
	if !request.CanBeCancelled() {
		response.BadRequest(c, "Request cannot be cancelled")
		return
	}

	oldStatus := request.Status
	request.Status = models.StatusCancelled

	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&request).Error; err != nil {
			return err
		}

		history := models.NewHistory(request.ID, userID, models.ActionCancelled, oldStatus, models.StatusCancelled, "Request cancelled by requester")
		return tx.Create(history).Error
	})

	if err != nil {
		response.InternalServerError(c, "Failed to cancel request")
		return
	}

	response.SuccessWithMessage(c, "Request cancelled successfully", nil)
}

// GetMyRequests returns the current user's requests
func (h *RequestHandler) GetMyRequests(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	status := c.Query("status")

	offset := (page - 1) * perPage
	userID := middleware.GetUserID(c)

	query := h.db.Model(&models.PurchaseRequest{}).
		Where("requester_id = ?", userID).
		Preload("Items")

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
