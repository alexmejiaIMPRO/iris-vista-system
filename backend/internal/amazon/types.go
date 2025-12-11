package amazon

import "time"

// AmazonProduct represents a product scraped from Amazon
type AmazonProduct struct {
	ASIN          string  `json:"asin"`
	Title         string  `json:"title"`
	Price         float64 `json:"price"`
	Currency      string  `json:"currency"`
	Rating        float64 `json:"rating"`
	ReviewCount   int     `json:"review_count"`
	ImageURL      string  `json:"image_url"`
	ProductURL    string  `json:"product_url"`
	IsPrime       bool    `json:"is_prime"`
	IsBestSeller  bool    `json:"is_best_seller"`
	Availability  string  `json:"availability"`
	Category      string  `json:"category"`
	Supplier      string  `json:"supplier"`
	Specification string  `json:"specification"`
}

// SearchParams represents search parameters for Amazon
type SearchParams struct {
	Query    string `json:"query"`
	Category string `json:"category,omitempty"`
	MinPrice float64 `json:"min_price,omitempty"`
	MaxPrice float64 `json:"max_price,omitempty"`
	Page     int    `json:"page,omitempty"`
	SortBy   string `json:"sort_by,omitempty"` // relevance, price-asc, price-desc, rating
}

// SearchResult represents the result of an Amazon search
type SearchResult struct {
	Products   []AmazonProduct `json:"products"`
	TotalCount int             `json:"total_count"`
	Page       int             `json:"page"`
	HasMore    bool            `json:"has_more"`
}

// SessionInfo stores Amazon session information
type SessionInfo struct {
	IsLoggedIn   bool      `json:"is_logged_in"`
	Username     string    `json:"username"`
	LastLoginAt  time.Time `json:"last_login_at"`
	SessionValid bool      `json:"session_valid"`
}

// FilterRule represents a rule for filtering Amazon products
type FilterRule struct {
	ID       uint   `json:"id"`
	Name     string `json:"name"`
	RuleType string `json:"rule_type"` // price_max, price_min, category_allow, category_block, supplier_block, keyword_block
	Value    string `json:"value"`
	IsActive bool   `json:"is_active"`
}
