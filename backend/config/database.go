package config

import (
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDatabase(cfg *Config) (*gorm.DB, error) {
	var logLevel logger.LogLevel
	if cfg.Server.Environment == "development" {
		logLevel = logger.Info
	} else {
		logLevel = logger.Silent
	}

	db, err := gorm.Open(sqlite.Open(cfg.Database.Path), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, err
	}

	DB = db
	log.Println("Database connected successfully")
	return db, nil
}

func GetDB() *gorm.DB {
	return DB
}
