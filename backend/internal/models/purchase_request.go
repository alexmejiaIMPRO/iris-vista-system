package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

type RequestStatus string

const (
	StatusPending       RequestStatus = "pending"
	StatusApproved      RequestStatus = "approved"
	StatusRejected      RequestStatus = "rejected"
	StatusInfoRequested RequestStatus = "info_requested"
	StatusPurchased     RequestStatus = "purchased"
)

type Urgency string

const (
	UrgencyNormal Urgency = "normal"
	UrgencyUrgent Urgency = "urgent"
)

// PurchaseRequest represents a simplified purchase request for any product URL
type PurchaseRequest struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	RequestNumber string         `gorm:"uniqueIndex;not null;size:50" json:"request_number"`

	// Product information (extracted from URL)
	URL                string   `gorm:"not null;size:2000" json:"url"`
	ProductTitle       string   `gorm:"size:500" json:"product_title"`
	ProductImageURL    string   `gorm:"size:2000" json:"product_image_url"`
	ProductDescription string   `gorm:"type:text" json:"product_description"`
	EstimatedPrice     *float64 `json:"estimated_price,omitempty"`
	Currency           string   `gorm:"default:'MXN';size:10" json:"currency"`

	// Request details
	Quantity      int     `gorm:"not null;default:1" json:"quantity"`
	Justification string  `gorm:"type:text" json:"justification"`
	Urgency       Urgency `gorm:"default:'normal';size:20" json:"urgency"`

	// Requester
	RequesterID uint `gorm:"not null;index" json:"requester_id"`
	Requester   User `gorm:"foreignKey:RequesterID" json:"requester"`

	// Status
	Status RequestStatus `gorm:"default:'pending';size:20;index" json:"status"`

	// Approval flow
	ApprovedByID    *uint      `json:"approved_by_id,omitempty"`
	ApprovedBy      *User      `gorm:"foreignKey:ApprovedByID" json:"approved_by,omitempty"`
	ApprovedAt      *time.Time `json:"approved_at,omitempty"`
	RejectedByID    *uint      `json:"rejected_by_id,omitempty"`
	RejectedBy      *User      `gorm:"foreignKey:RejectedByID" json:"rejected_by,omitempty"`
	RejectedAt      *time.Time `json:"rejected_at,omitempty"`
	RejectionReason string     `gorm:"type:text" json:"rejection_reason,omitempty"`

	// Info request (when GM needs more info)
	InfoRequestedAt *time.Time `json:"info_requested_at,omitempty"`
	InfoRequestNote string     `gorm:"type:text" json:"info_request_note,omitempty"`

	// Purchase completion (when admin marks as purchased)
	PurchasedByID *uint      `json:"purchased_by_id,omitempty"`
	PurchasedBy   *User      `gorm:"foreignKey:PurchasedByID" json:"purchased_by,omitempty"`
	PurchasedAt   *time.Time `json:"purchased_at,omitempty"`
	PurchaseNotes string     `gorm:"type:text" json:"purchase_notes,omitempty"`

	// Amazon automation status
	IsAmazonURL       bool       `gorm:"default:false" json:"is_amazon_url"`
	AddedToCart       bool       `gorm:"default:false" json:"added_to_cart"`
	AddedToCartAt     *time.Time `json:"added_to_cart_at,omitempty"`
	CartError         string     `gorm:"type:text" json:"cart_error,omitempty"`
	AmazonASIN        string     `gorm:"size:20" json:"amazon_asin,omitempty"`

	// History
	History []RequestHistory `gorm:"foreignKey:RequestID" json:"history,omitempty"`

	// Timestamps
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
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
	return pr.Status == StatusPending || pr.Status == StatusInfoRequested
}

// CanBeApproved checks if the request can be approved
func (pr *PurchaseRequest) CanBeApproved() bool {
	return pr.Status == StatusPending
}

// CanBeRejected checks if the request can be rejected
func (pr *PurchaseRequest) CanBeRejected() bool {
	return pr.Status == StatusPending
}

// CanRequestInfo checks if more info can be requested
func (pr *PurchaseRequest) CanRequestInfo() bool {
	return pr.Status == StatusPending
}

// CanBeMarkedPurchased checks if the request can be marked as purchased
func (pr *PurchaseRequest) CanBeMarkedPurchased() bool {
	return pr.Status == StatusApproved
}

// IsPending checks if the request is pending
func (pr *PurchaseRequest) IsPending() bool {
	return pr.Status == StatusPending
}

// IsApproved checks if the request is approved
func (pr *PurchaseRequest) IsApproved() bool {
	return pr.Status == StatusApproved
}

// IsUrgent checks if the request is urgent
func (pr *PurchaseRequest) IsUrgent() bool {
	return pr.Urgency == UrgencyUrgent
}
