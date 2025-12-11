package models

import (
	"time"
)

type RequestItem struct {
	ID            uint          `gorm:"primaryKey" json:"id"`
	RequestID     uint          `gorm:"not null;index" json:"request_id"`
	ProductID     *uint         `json:"product_id,omitempty"`
	Product       *Product      `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	AmazonASIN    string        `gorm:"size:20" json:"amazon_asin,omitempty"`
	Name          string        `gorm:"not null;size:255" json:"name"`
	Specification string        `gorm:"type:text" json:"specification"`
	Quantity      int           `gorm:"not null" json:"quantity"`
	UnitPrice     float64       `gorm:"not null" json:"unit_price"`
	TotalPrice    float64       `gorm:"not null" json:"total_price"`
	Supplier      string        `gorm:"size:255" json:"supplier"`
	Source        ProductSource `gorm:"size:20" json:"source"` // internal, amazon
	ImageURL      string        `gorm:"size:500" json:"image_url"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
}

// CalculateTotalPrice calculates the total price based on quantity and unit price
func (ri *RequestItem) CalculateTotalPrice() {
	ri.TotalPrice = float64(ri.Quantity) * ri.UnitPrice
}

// IsFromAmazon checks if the item is from Amazon
func (ri *RequestItem) IsFromAmazon() bool {
	return ri.Source == SourceAmazon || ri.AmazonASIN != ""
}
