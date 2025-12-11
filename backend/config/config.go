package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	Crypto   CryptoConfig
}

type ServerConfig struct {
	Port         string
	Environment  string
	AllowOrigins []string
}

type DatabaseConfig struct {
	Path string
}

type JWTConfig struct {
	SecretKey          string
	AccessTokenExpiry  time.Duration
	RefreshTokenExpiry time.Duration
}

type CryptoConfig struct {
	EncryptionKey string
}

func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Port:         getEnv("PORT", "8080"),
			Environment:  getEnv("ENVIRONMENT", "development"),
			AllowOrigins: []string{getEnv("CORS_ORIGIN", "http://localhost:3000")},
		},
		Database: DatabaseConfig{
			Path: getEnv("DATABASE_PATH", "./vista.db"),
		},
		JWT: JWTConfig{
			SecretKey:          getEnv("JWT_SECRET", "your-super-secret-key-change-in-production"),
			AccessTokenExpiry:  getDurationEnv("JWT_ACCESS_EXPIRY", 15*time.Minute),
			RefreshTokenExpiry: getDurationEnv("JWT_REFRESH_EXPIRY", 7*24*time.Hour),
		},
		Crypto: CryptoConfig{
			EncryptionKey: getEnv("ENCRYPTION_KEY", "32-byte-long-key-for-aes256!!!!!"), // Must be 32 bytes for AES-256
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getDurationEnv(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if minutes, err := strconv.Atoi(value); err == nil {
			return time.Duration(minutes) * time.Minute
		}
	}
	return defaultValue
}
