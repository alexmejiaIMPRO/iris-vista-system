package models

import (
	"time"

	"gorm.io/gorm"
)

type ProductSource string

const (
	SourceInternal ProductSource = "internal"
	SourceExternal ProductSource = "external"
)

type Product struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	SKU           string         `gorm:"uniqueIndex;not null;size:100" json:"sku"`
	Name          string         `gorm:"not null;size:255" json:"name"`
	NameZh        string         `gorm:"size:255" json:"name_zh"`
	NameEs        string         `gorm:"size:255" json:"name_es"`
	Description   string         `gorm:"type:text" json:"description"`
	DescZh        string         `gorm:"type:text" json:"desc_zh"`
	DescEs        string         `gorm:"type:text" json:"desc_es"`
	Category      string         `gorm:"index;size:100" json:"category"`
	Model         string         `gorm:"size:100" json:"model"`
	Specification string         `gorm:"type:text" json:"specification"`
	SpecZh        string         `gorm:"type:text" json:"spec_zh"`
	SpecEs        string         `gorm:"type:text" json:"spec_es"`
	Supplier      string         `gorm:"size:255" json:"supplier"`
	SupplierCode  string         `gorm:"size:100" json:"supplier_code"` // Supplier's part number
	Price         float64        `gorm:"not null" json:"price"`
	Currency      string         `gorm:"default:'USD';size:10" json:"currency"`
	Stock         int            `gorm:"default:0" json:"stock"`
	MinStock      int            `gorm:"default:0" json:"min_stock"`      // Minimum stock level for alerts
	MaxStock      int            `gorm:"default:0" json:"max_stock"`      // Maximum stock level
	Location      string         `gorm:"size:100" json:"location"`        // Warehouse/shelf location
	ImageURL      string         `gorm:"size:500" json:"image_url"`
	ImageEmoji    string         `gorm:"size:10" json:"image_emoji"`      // For internal products using emoji
	ClickUpID     string         `gorm:"size:50" json:"clickup_id"`       // Optional ClickUp task ID
	Source        ProductSource  `gorm:"default:'internal';size:20" json:"source"`
	IsActive      bool           `gorm:"default:true" json:"is_active"`
	Images        []ProductImage `gorm:"foreignKey:ProductID" json:"images"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

// ProductImage represents additional images for a product
type ProductImage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ProductID uint      `gorm:"index;not null" json:"product_id"`
	URL       string    `gorm:"size:500;not null" json:"url"`
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	IsPrimary bool      `gorm:"default:false" json:"is_primary"`
	Caption   string    `gorm:"size:255" json:"caption"`
	CreatedAt time.Time `json:"created_at"`
}

// GetLocalizedName returns the product name in the specified language
func (p *Product) GetLocalizedName(lang string) string {
	switch lang {
	case "zh":
		if p.NameZh != "" {
			return p.NameZh
		}
	case "es":
		if p.NameEs != "" {
			return p.NameEs
		}
	}
	return p.Name
}

// GetLocalizedSpec returns the product specification in the specified language
func (p *Product) GetLocalizedSpec(lang string) string {
	switch lang {
	case "zh":
		if p.SpecZh != "" {
			return p.SpecZh
		}
	case "es":
		if p.SpecEs != "" {
			return p.SpecEs
		}
	}
	return p.Specification
}

// StockStatus returns the stock status
func (p *Product) StockStatus() string {
	if p.Stock == 0 {
		return "out_of_stock"
	} else if p.Stock < 100 {
		return "limited"
	}
	return "in_stock"
}
