package models

import (
	"strconv"
	"strings"
	"time"
)

type RuleType string

const (
	RulePriceMax       RuleType = "price_max"
	RulePriceMin       RuleType = "price_min"
	RuleCategoryAllow  RuleType = "category_allow"
	RuleCategoryBlock  RuleType = "category_block"
	RuleSupplierAllow  RuleType = "supplier_allow"
	RuleSupplierBlock  RuleType = "supplier_block"
	RuleBrandAllow     RuleType = "brand_allow"
	RuleBrandBlock     RuleType = "brand_block"
	RuleKeywordBlock   RuleType = "keyword_block"
)

type FilterRule struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"not null;size:255" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	RuleType    RuleType  `gorm:"not null;size:30" json:"rule_type"`
	Value       string    `gorm:"not null;type:text" json:"value"` // For price: numeric, for others: comma-separated list
	Priority    int       `gorm:"default:0" json:"priority"`
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	CreatedByID uint      `json:"created_by_id"`
	CreatedBy   User      `gorm:"foreignKey:CreatedByID" json:"created_by"`
}

// GetPriceValue returns the value as a float (for price rules)
func (fr *FilterRule) GetPriceValue() float64 {
	val, _ := strconv.ParseFloat(fr.Value, 64)
	return val
}

// GetListValues returns the value as a list (for allow/block rules)
func (fr *FilterRule) GetListValues() []string {
	values := strings.Split(fr.Value, ",")
	result := make([]string, 0, len(values))
	for _, v := range values {
		trimmed := strings.TrimSpace(v)
		if trimmed != "" {
			result = append(result, strings.ToLower(trimmed))
		}
	}
	return result
}

// IsPriceRule checks if this is a price-related rule
func (fr *FilterRule) IsPriceRule() bool {
	return fr.RuleType == RulePriceMax || fr.RuleType == RulePriceMin
}

// IsBlockRule checks if this is a blocking rule
func (fr *FilterRule) IsBlockRule() bool {
	return strings.HasSuffix(string(fr.RuleType), "_block")
}

// IsAllowRule checks if this is an allow rule
func (fr *FilterRule) IsAllowRule() bool {
	return strings.HasSuffix(string(fr.RuleType), "_allow")
}
