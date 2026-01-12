package handlers

import (
	"log"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"vista-backend/internal/middleware"
	"vista-backend/internal/models"
	"vista-backend/internal/services/amazon"
	"vista-backend/pkg/crypto"
	"vista-backend/pkg/response"
)

type ApprovalHandler struct {
	db            *gorm.DB
	amazonSvc     *amazon.AutomationService
	encryptionSvc *crypto.EncryptionService
}

func NewApprovalHandler(db *gorm.DB, amazonSvc *amazon.AutomationService, encryptionSvc *crypto.EncryptionService) *ApprovalHandler {
	return &ApprovalHandler{
		db:            db,
		amazonSvc:     amazonSvc,
		encryptionSvc: encryptionSvc,
	}
}

type ApprovalAction struct {
	Comment string `json:"comment"`
}

// ListPendingApprovals returns a list of pending requests for approval
func (h *ApprovalHandler) ListPendingApprovals(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	offset := (page - 1) * perPage

	query := h.db.Model(&models.PurchaseRequest{}).
		Where("status = ?", models.StatusPending).
		Preload("Requester")

	var total int64
	query.Count(&total)

	var requests []models.PurchaseRequest
	if err := query.Offset(offset).Limit(perPage).Order("urgency DESC, created_at ASC").Find(&requests).Error; err != nil {
		response.InternalServerError(c, "Failed to fetch pending approvals")
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

// GetApprovalDetails returns details of a request for approval
func (h *ApprovalHandler) GetApprovalDetails(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid request ID")
		return
	}

	var request models.PurchaseRequest
	if err := h.db.
		Preload("Requester").
		Preload("History").
		Preload("History.User").
		First(&request, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Request not found")
		} else {
			response.InternalServerError(c, "Failed to fetch request")
		}
		return
	}

	response.Success(c, requestToResponse(request))
}

// ApproveRequest approves a purchase request
func (h *ApprovalHandler) ApproveRequest(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid request ID")
		return
	}

	var input ApprovalAction
	if err := c.ShouldBindJSON(&input); err != nil {
		input.Comment = ""
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

	if !request.CanBeApproved() {
		response.BadRequest(c, "Request cannot be approved")
		return
	}

	oldStatus := request.Status
	now := time.Now()
	request.Status = models.StatusApproved
	request.ApprovedByID = &userID
	request.ApprovedAt = &now

	// If it's an Amazon URL, try to add to cart
	if request.IsAmazonURL && h.amazonSvc != nil {
		go h.addToAmazonCart(&request)
	}

	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&request).Error; err != nil {
			return err
		}

		comment := input.Comment
		if comment == "" {
			comment = "Request approved"
		}
		history := models.NewHistory(request.ID, userID, models.ActionApproved, oldStatus, models.StatusApproved, comment)
		return tx.Create(history).Error
	})

	if err != nil {
		response.InternalServerError(c, "Failed to approve request")
		return
	}

	// Reload with relations
	h.db.
		Preload("Requester").
		Preload("History").
		Preload("History.User").
		Preload("ApprovedBy").
		First(&request, request.ID)

	response.SuccessWithMessage(c, "Request approved successfully", requestToResponse(request))
}

// addToAmazonCart adds the product to Amazon cart asynchronously
func (h *ApprovalHandler) addToAmazonCart(request *models.PurchaseRequest) {
	// Check if Amazon is configured
	var config models.AmazonConfig
	if err := h.db.First(&config).Error; err != nil {
		log.Printf("Amazon config not found, skipping cart automation for request %d", request.ID)
		return
	}

	if !config.CanConnect() {
		log.Printf("Amazon not configured or inactive, skipping cart automation for request %d", request.ID)
		return
	}

	// Decrypt password
	password, err := h.encryptionSvc.Decrypt(config.EncryptedPassword)
	if err != nil {
		log.Printf("Failed to decrypt Amazon password: %v", err)
		h.updateCartError(request.ID, "Failed to decrypt credentials")
		return
	}

	// Set credentials
	h.amazonSvc.SetCredentials(config.Email, password, config.Marketplace)

	// Initialize browser if needed
	if err := h.amazonSvc.Initialize(); err != nil {
		log.Printf("Failed to initialize Amazon browser: %v", err)
		h.updateCartError(request.ID, "Failed to initialize browser: "+err.Error())
		return
	}

	// Login if needed
	if !h.amazonSvc.IsLoggedIn() {
		if err := h.amazonSvc.Login(); err != nil {
			log.Printf("Failed to login to Amazon: %v", err)
			h.updateCartError(request.ID, "Failed to login: "+err.Error())
			return
		}
	}

	// Add to cart
	if err := h.amazonSvc.AddToCart(request.URL, request.Quantity); err != nil {
		log.Printf("Failed to add to cart: %v", err)
		h.updateCartError(request.ID, "Failed to add to cart: "+err.Error())
		return
	}

	// Update request as successfully added to cart
	now := time.Now()
	h.db.Model(&models.PurchaseRequest{}).Where("id = ?", request.ID).Updates(map[string]interface{}{
		"added_to_cart":    true,
		"added_to_cart_at": now,
		"cart_error":       "",
	})

	log.Printf("Successfully added request %d to Amazon cart", request.ID)
}

// updateCartError updates the cart error for a request
func (h *ApprovalHandler) updateCartError(requestID uint, errMsg string) {
	h.db.Model(&models.PurchaseRequest{}).Where("id = ?", requestID).Updates(map[string]interface{}{
		"cart_error": errMsg,
	})
}

// RejectRequest rejects a purchase request
func (h *ApprovalHandler) RejectRequest(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid request ID")
		return
	}

	var input ApprovalAction
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Comment is required for rejection")
		return
	}

	if input.Comment == "" {
		response.BadRequest(c, "Rejection reason is required")
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

	if !request.CanBeRejected() {
		response.BadRequest(c, "Request cannot be rejected")
		return
	}

	oldStatus := request.Status
	now := time.Now()
	request.Status = models.StatusRejected
	request.RejectedByID = &userID
	request.RejectedAt = &now
	request.RejectionReason = input.Comment

	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&request).Error; err != nil {
			return err
		}

		history := models.NewHistory(request.ID, userID, models.ActionRejected, oldStatus, models.StatusRejected, input.Comment)
		return tx.Create(history).Error
	})

	if err != nil {
		response.InternalServerError(c, "Failed to reject request")
		return
	}

	// Reload with relations
	h.db.
		Preload("Requester").
		Preload("History").
		Preload("History.User").
		Preload("RejectedBy").
		First(&request, request.ID)

	response.SuccessWithMessage(c, "Request rejected", requestToResponse(request))
}

// RequestInfo requests more information from the requester
func (h *ApprovalHandler) RequestInfo(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid request ID")
		return
	}

	var input ApprovalAction
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Comment is required")
		return
	}

	if input.Comment == "" {
		response.BadRequest(c, "Please specify what information is needed")
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

	if !request.CanRequestInfo() {
		response.BadRequest(c, "Cannot request more information for this request")
		return
	}

	oldStatus := request.Status
	now := time.Now()
	request.Status = models.StatusInfoRequested
	request.InfoRequestedAt = &now
	request.InfoRequestNote = input.Comment

	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&request).Error; err != nil {
			return err
		}

		history := models.NewHistory(request.ID, userID, models.ActionReturned, oldStatus, models.StatusInfoRequested, input.Comment)
		return tx.Create(history).Error
	})

	if err != nil {
		response.InternalServerError(c, "Failed to request more information")
		return
	}

	// Reload with relations
	h.db.
		Preload("Requester").
		Preload("History").
		Preload("History.User").
		First(&request, request.ID)

	response.SuccessWithMessage(c, "Information requested from requester", requestToResponse(request))
}

// GetApprovalStats returns approval statistics
func (h *ApprovalHandler) GetApprovalStats(c *gin.Context) {
	var stats struct {
		Pending      int64 `json:"pending"`
		Approved     int64 `json:"approved"`
		Rejected     int64 `json:"rejected"`
		InfoRequired int64 `json:"info_required"`
		Purchased    int64 `json:"purchased"`
		Total        int64 `json:"total"`
		Urgent       int64 `json:"urgent"`
		AmazonInCart int64 `json:"amazon_in_cart"`
	}

	h.db.Model(&models.PurchaseRequest{}).Where("status = ?", models.StatusPending).Count(&stats.Pending)
	h.db.Model(&models.PurchaseRequest{}).Where("status = ?", models.StatusApproved).Count(&stats.Approved)
	h.db.Model(&models.PurchaseRequest{}).Where("status = ?", models.StatusRejected).Count(&stats.Rejected)
	h.db.Model(&models.PurchaseRequest{}).Where("status = ?", models.StatusInfoRequested).Count(&stats.InfoRequired)
	h.db.Model(&models.PurchaseRequest{}).Where("status = ?", models.StatusPurchased).Count(&stats.Purchased)
	h.db.Model(&models.PurchaseRequest{}).Count(&stats.Total)
	h.db.Model(&models.PurchaseRequest{}).Where("status = ? AND urgency = ?", models.StatusPending, models.UrgencyUrgent).Count(&stats.Urgent)
	h.db.Model(&models.PurchaseRequest{}).Where("added_to_cart = ?", true).Count(&stats.AmazonInCart)

	response.Success(c, stats)
}
