package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

type RequestStatus string

const (
	StatusPending    RequestStatus = "pending"
	StatusApproved   RequestStatus = "approved"
	StatusRejected   RequestStatus = "rejected"
	StatusProcessing RequestStatus = "processing"
	StatusCompleted  RequestStatus = "completed"
	StatusCancelled  RequestStatus = "cancelled"
)

type RequestType string

const (
	TypeMaterialIssue       RequestType = "material_issue"
	TypePurchaseRequisition RequestType = "purchase_requisition"
)

type PurchaseRequest struct {
	ID              uint             `gorm:"primaryKey" json:"id"`
	RequestNumber   string           `gorm:"uniqueIndex;not null;size:50" json:"request_number"`
	RequesterID     uint             `gorm:"not null;index" json:"requester_id"`
	Requester       User             `gorm:"foreignKey:RequesterID" json:"requester"`
	Status          RequestStatus    `gorm:"default:'pending';size:20" json:"status"`
	Type            RequestType      `gorm:"size:30" json:"type"`
	TotalAmount     float64          `json:"total_amount"`
	Currency        string           `gorm:"default:'USD';size:10" json:"currency"`
	CostCenter      string           `gorm:"size:50" json:"cost_center"`
	Purpose         string           `gorm:"type:text" json:"purpose"`
	Notes           string           `gorm:"type:text" json:"notes"`
	Priority        string           `gorm:"default:'normal';size:20" json:"priority"` // low, normal, high, urgent
	Items           []RequestItem    `gorm:"foreignKey:RequestID" json:"items"`
	History         []RequestHistory `gorm:"foreignKey:RequestID" json:"history"`
	AmazonOrderID   *uint            `json:"amazon_order_id,omitempty"`
	AmazonOrder     *AmazonOrder     `gorm:"foreignKey:AmazonOrderID" json:"amazon_order,omitempty"`
	ApprovedByID    *uint            `json:"approved_by_id,omitempty"`
	ApprovedBy      *User            `gorm:"foreignKey:ApprovedByID" json:"approved_by,omitempty"`
	ApprovedAt      *time.Time       `json:"approved_at,omitempty"`
	RejectedByID    *uint            `json:"rejected_by_id,omitempty"`
	RejectedBy      *User            `gorm:"foreignKey:RejectedByID" json:"rejected_by,omitempty"`
	RejectedAt      *time.Time       `json:"rejected_at,omitempty"`
	RejectionReason string           `gorm:"type:text" json:"rejection_reason,omitempty"`
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`
	DeletedAt       gorm.DeletedAt   `gorm:"index" json:"-"`
}

// GenerateRequestNumber generates a unique request number
func GenerateRequestNumber(db *gorm.DB) string {
	var count int64
	year := time.Now().Year()
	db.Model(&PurchaseRequest{}).Where("STRFTIME('%Y', created_at) = ?", fmt.Sprintf("%d", year)).Count(&count)
	return fmt.Sprintf("REQ-%d-%04d", year, count+1)
}

// CanBeCancelled checks if the request can be cancelled
func (pr *PurchaseRequest) CanBeCancelled() bool {
	return pr.Status == StatusPending
}

// CanBeApproved checks if the request can be approved
func (pr *PurchaseRequest) CanBeApproved() bool {
	return pr.Status == StatusPending
}

// IsPending checks if the request is pending
func (pr *PurchaseRequest) IsPending() bool {
	return pr.Status == StatusPending
}

// IsUrgent checks if the request is urgent
func (pr *PurchaseRequest) IsUrgent() bool {
	return pr.Priority == "urgent" || pr.Priority == "high"
}
