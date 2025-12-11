package models

import (
	"time"
)

type OrderStatus string

const (
	OrderStatusPending   OrderStatus = "pending"
	OrderStatusPlaced    OrderStatus = "placed"
	OrderStatusShipped   OrderStatus = "shipped"
	OrderStatusDelivered OrderStatus = "delivered"
	OrderStatusCancelled OrderStatus = "cancelled"
	OrderStatusFailed    OrderStatus = "failed"
)

type AmazonOrder struct {
	ID                uint        `gorm:"primaryKey" json:"id"`
	AmazonOrderNumber string      `gorm:"size:100" json:"amazon_order_number"`
	Status            OrderStatus `gorm:"default:'pending';size:20" json:"status"`
	TotalAmount       float64     `json:"total_amount"`
	Currency          string      `gorm:"default:'USD';size:10" json:"currency"`
	ShippingAddress   string      `gorm:"type:text" json:"shipping_address"`
	TrackingNumber    string      `gorm:"size:100" json:"tracking_number"`
	TrackingURL       string      `gorm:"size:500" json:"tracking_url"`
	EstimatedDelivery *time.Time  `json:"estimated_delivery"`
	ActualDelivery    *time.Time  `json:"actual_delivery"`
	ErrorMessage      string      `gorm:"type:text" json:"error_message"`
	AutomationLog     string      `gorm:"type:text" json:"automation_log"`
	OrderedAt         *time.Time  `json:"ordered_at"`
	CreatedAt         time.Time   `json:"created_at"`
	UpdatedAt         time.Time   `json:"updated_at"`
}

// IsCompleted checks if the order is in a final state
func (ao *AmazonOrder) IsCompleted() bool {
	return ao.Status == OrderStatusDelivered || ao.Status == OrderStatusCancelled || ao.Status == OrderStatusFailed
}

// IsTrackable checks if the order can be tracked
func (ao *AmazonOrder) IsTrackable() bool {
	return ao.Status == OrderStatusShipped && ao.TrackingNumber != ""
}

// HasError checks if the order has an error
func (ao *AmazonOrder) HasError() bool {
	return ao.Status == OrderStatusFailed && ao.ErrorMessage != ""
}
