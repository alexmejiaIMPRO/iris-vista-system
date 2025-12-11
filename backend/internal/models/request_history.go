package models

import (
	"time"
)

type HistoryAction string

const (
	ActionCreated   HistoryAction = "created"
	ActionSubmitted HistoryAction = "submitted"
	ActionApproved  HistoryAction = "approved"
	ActionRejected  HistoryAction = "rejected"
	ActionReturned  HistoryAction = "returned"
	ActionCancelled HistoryAction = "cancelled"
	ActionProcessed HistoryAction = "processed"
	ActionCompleted HistoryAction = "completed"
)

type RequestHistory struct {
	ID        uint          `gorm:"primaryKey" json:"id"`
	RequestID uint          `gorm:"not null;index" json:"request_id"`
	UserID    uint          `gorm:"not null" json:"user_id"`
	User      User          `gorm:"foreignKey:UserID" json:"user"`
	Action    HistoryAction `gorm:"not null;size:30" json:"action"`
	Comment   string        `gorm:"type:text" json:"comment"`
	OldStatus RequestStatus `gorm:"size:20" json:"old_status"`
	NewStatus RequestStatus `gorm:"size:20" json:"new_status"`
	CreatedAt time.Time     `json:"created_at"`
}

// NewHistory creates a new history entry
func NewHistory(requestID uint, userID uint, action HistoryAction, oldStatus, newStatus RequestStatus, comment string) *RequestHistory {
	return &RequestHistory{
		RequestID: requestID,
		UserID:    userID,
		Action:    action,
		OldStatus: oldStatus,
		NewStatus: newStatus,
		Comment:   comment,
		CreatedAt: time.Now(),
	}
}
