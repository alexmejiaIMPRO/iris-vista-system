package models

import (
	"time"
)

// AmazonConfig stores Amazon Business credentials for automation
type AmazonConfig struct {
	ID uint `gorm:"primaryKey" json:"id"`

	// Amazon Business account credentials
	Email             string `gorm:"size:255" json:"email"`
	EncryptedPassword string `json:"-"` // AES-256 encrypted

	// Amazon domain
	Marketplace string `gorm:"size:100;default:www.amazon.com.mx" json:"marketplace"`

	// Status
	IsActive    bool       `gorm:"default:true" json:"is_active"`
	LastLoginAt *time.Time `json:"last_login_at"`
	LastTestAt  *time.Time `json:"last_test_at"`
	TestStatus  string     `gorm:"size:50" json:"test_status"` // success, failed, pending
	TestMessage string     `gorm:"type:text" json:"test_message"`

	// Metadata
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	CreatedByID uint      `json:"created_by_id"`
	CreatedBy   User      `gorm:"foreignKey:CreatedByID" json:"created_by"`
}

// IsConfigured checks if Amazon credentials are configured
func (ac *AmazonConfig) IsConfigured() bool {
	return ac.Email != "" && ac.EncryptedPassword != ""
}

// CanConnect checks if we can attempt to connect
func (ac *AmazonConfig) CanConnect() bool {
	return ac.IsConfigured() && ac.IsActive
}

// GetAmazonBaseURL returns the Amazon base URL for the configured marketplace
func (ac *AmazonConfig) GetAmazonBaseURL() string {
	if ac.Marketplace == "" {
		return "https://www.amazon.com.mx"
	}
	return "https://" + ac.Marketplace
}
