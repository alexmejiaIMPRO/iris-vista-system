package models

import (
	"time"

	"gorm.io/gorm"
)

type UserRole string

const (
	RoleAdmin              UserRole = "admin"
	RoleSupplyChainManager UserRole = "supply_chain_manager"
	RoleGeneralManager     UserRole = "general_manager"
	RoleEmployee           UserRole = "employee"
)

type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Email        string         `gorm:"uniqueIndex;not null;size:255" json:"email"`
	PasswordHash string         `gorm:"not null" json:"-"`
	Name         string         `gorm:"not null;size:255" json:"name"`
	Role         UserRole       `gorm:"not null;size:50" json:"role"`
	CompanyCode  string         `gorm:"size:50" json:"company_code"`
	CostCenter   string         `gorm:"size:50" json:"cost_center"`
	Department   string         `gorm:"size:100" json:"department"`
	Status       string         `gorm:"default:'active';size:20" json:"status"` // active, inactive
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

func (u *User) IsActive() bool {
	return u.Status == "active"
}

func (u *User) IsAdmin() bool {
	return u.Role == RoleAdmin
}

func (u *User) IsGeneralManager() bool {
	return u.Role == RoleGeneralManager
}

func (u *User) IsSupplyChainManager() bool {
	return u.Role == RoleSupplyChainManager
}

func (u *User) CanApprove() bool {
	return u.Role == RoleGeneralManager || u.Role == RoleAdmin
}

func (u *User) CanManageUsers() bool {
	return u.Role == RoleAdmin
}

func (u *User) CanConfigureAmazon() bool {
	return u.Role == RoleAdmin
}

func (u *User) CanViewAllRequests() bool {
	return u.Role == RoleAdmin || u.Role == RoleSupplyChainManager || u.Role == RoleGeneralManager
}
