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

type ApprovalHandler struct {
	db *gorm.DB
}

func NewApprovalHandler(db *gorm.DB) *ApprovalHandler {
	return &ApprovalHandler{db: db}
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
		Preload("Requester").
		Preload("Items")

	var total int64
	query.Count(&total)

	var requests []models.PurchaseRequest
	if err := query.Offset(offset).Limit(perPage).Order("priority DESC, created_at ASC").Find(&requests).Error; err != nil {
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
		Preload("Items").
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
		// Comment is optional, so ignore binding errors
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

	// TODO: Trigger Amazon order automation here if items contain Amazon products

	// Reload with relations
	h.db.
		Preload("Requester").
		Preload("Items").
		Preload("History").
		Preload("History.User").
		Preload("ApprovedBy").
		First(&request, request.ID)

	response.SuccessWithMessage(c, "Request approved successfully", requestToResponse(request))
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

	if !request.CanBeApproved() {
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
		Preload("Items").
		Preload("History").
		Preload("History.User").
		Preload("RejectedBy").
		First(&request, request.ID)

	response.SuccessWithMessage(c, "Request rejected", requestToResponse(request))
}

// ReturnRequest returns a request for modification
func (h *ApprovalHandler) ReturnRequest(c *gin.Context) {
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
		response.BadRequest(c, "Return reason is required")
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

	if !request.IsPending() {
		response.BadRequest(c, "Only pending requests can be returned")
		return
	}

	// For "return", we keep it as pending but add a history entry
	err = h.db.Transaction(func(tx *gorm.DB) error {
		history := models.NewHistory(request.ID, userID, models.ActionReturned, models.StatusPending, models.StatusPending, input.Comment)
		return tx.Create(history).Error
	})

	if err != nil {
		response.InternalServerError(c, "Failed to return request")
		return
	}

	// Reload with relations
	h.db.
		Preload("Requester").
		Preload("Items").
		Preload("History").
		Preload("History.User").
		First(&request, request.ID)

	response.SuccessWithMessage(c, "Request returned for modification", requestToResponse(request))
}

// GetApprovalStats returns approval statistics
func (h *ApprovalHandler) GetApprovalStats(c *gin.Context) {
	var stats struct {
		Pending   int64 `json:"pending"`
		Approved  int64 `json:"approved"`
		Rejected  int64 `json:"rejected"`
		Total     int64 `json:"total"`
		Urgent    int64 `json:"urgent"`
	}

	h.db.Model(&models.PurchaseRequest{}).Where("status = ?", models.StatusPending).Count(&stats.Pending)
	h.db.Model(&models.PurchaseRequest{}).Where("status = ?", models.StatusApproved).Count(&stats.Approved)
	h.db.Model(&models.PurchaseRequest{}).Where("status = ?", models.StatusRejected).Count(&stats.Rejected)
	h.db.Model(&models.PurchaseRequest{}).Count(&stats.Total)
	h.db.Model(&models.PurchaseRequest{}).Where("status = ? AND priority IN (?, ?)", models.StatusPending, "urgent", "high").Count(&stats.Urgent)

	response.Success(c, stats)
}
