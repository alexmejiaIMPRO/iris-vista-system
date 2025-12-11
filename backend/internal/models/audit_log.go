package models

import (
	"time"
)

type AuditLog struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     uint      `gorm:"index" json:"user_id"`
	User       User      `gorm:"foreignKey:UserID" json:"user"`
	Action     string    `gorm:"not null;size:100" json:"action"`
	Resource   string    `gorm:"not null;size:100" json:"resource"`
	ResourceID uint      `json:"resource_id"`
	OldValue   string    `gorm:"type:text" json:"old_value"`
	NewValue   string    `gorm:"type:text" json:"new_value"`
	IPAddress  string    `gorm:"size:45" json:"ip_address"`
	UserAgent  string    `gorm:"size:500" json:"user_agent"`
	CreatedAt  time.Time `gorm:"index" json:"created_at"`
}

// NewAuditLog creates a new audit log entry
func NewAuditLog(userID uint, action, resource string, resourceID uint, oldValue, newValue, ipAddress, userAgent string) *AuditLog {
	return &AuditLog{
		UserID:     userID,
		Action:     action,
		Resource:   resource,
		ResourceID: resourceID,
		OldValue:   oldValue,
		NewValue:   newValue,
		IPAddress:  ipAddress,
		UserAgent:  userAgent,
		CreatedAt:  time.Now(),
	}
}
