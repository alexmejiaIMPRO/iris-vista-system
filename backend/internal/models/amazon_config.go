package models

import (
	"time"
)

type AmazonConfig struct {
	ID                     uint       `gorm:"primaryKey" json:"id"`

	// PA-API (Product Advertising API) credentials
	AccessKey              string     `gorm:"size:100" json:"access_key"`
	EncryptedSecretKey     string     `json:"-"` // AES-256 encrypted
	PartnerTag             string     `gorm:"size:100" json:"partner_tag"` // Amazon Associates tag
	Region                 string     `gorm:"size:50;default:us-east-1" json:"region"` // AWS region
	Marketplace            string     `gorm:"size:50;default:www.amazon.com" json:"marketplace"` // Amazon domain

	// Legacy Business account fields (for ordering)
	Username               string     `gorm:"size:255" json:"username"`
	EncryptedPassword      string     `json:"-"` // AES-256 encrypted
	AccountID              string     `gorm:"size:100" json:"account_id"`
	BusinessGroup          string     `gorm:"size:255" json:"business_group"`
	DefaultShippingAddress string     `gorm:"type:text" json:"default_shipping_address"`

	// Status
	IsActive               bool       `gorm:"default:true" json:"is_active"`
	LastSyncAt             *time.Time `json:"last_sync_at"`
	LastTestAt             *time.Time `json:"last_test_at"`
	TestStatus             string     `gorm:"size:50" json:"test_status"` // success, failed, pending
	TestMessage            string     `gorm:"type:text" json:"test_message"`

	CreatedAt              time.Time  `json:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at"`
	CreatedByID            uint       `json:"created_by_id"`
	CreatedBy              User       `gorm:"foreignKey:CreatedByID" json:"created_by"`
}

// IsPAAPIConfigured checks if PA-API is configured for product search
func (ac *AmazonConfig) IsPAAPIConfigured() bool {
	return ac.AccessKey != "" && ac.EncryptedSecretKey != "" && ac.PartnerTag != ""
}

// IsBusinessConfigured checks if Business account is configured for ordering
func (ac *AmazonConfig) IsBusinessConfigured() bool {
	return ac.Username != "" && ac.EncryptedPassword != ""
}

// IsConfigured checks if either PA-API or Business is configured
func (ac *AmazonConfig) IsConfigured() bool {
	return ac.IsPAAPIConfigured() || ac.IsBusinessConfigured()
}

// CanConnect checks if we can attempt to connect
func (ac *AmazonConfig) CanConnect() bool {
	return ac.IsConfigured() && ac.IsActive
}
