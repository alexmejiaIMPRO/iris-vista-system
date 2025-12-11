package jwt

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrInvalidToken = errors.New("invalid token")
	ErrExpiredToken = errors.New("token has expired")
	ErrInvalidClaim = errors.New("invalid token claims")
)

type TokenType string

const (
	AccessToken  TokenType = "access"
	RefreshToken TokenType = "refresh"
)

type Claims struct {
	UserID uint      `json:"user_id"`
	Email  string    `json:"email"`
	Role   string    `json:"role"`
	Type   TokenType `json:"type"`
	jwt.RegisteredClaims
}

type JWTService struct {
	secretKey          []byte
	accessTokenExpiry  time.Duration
	refreshTokenExpiry time.Duration
}

// NewJWTService creates a new JWT service
func NewJWTService(secretKey string, accessExpiry, refreshExpiry time.Duration) *JWTService {
	return &JWTService{
		secretKey:          []byte(secretKey),
		accessTokenExpiry:  accessExpiry,
		refreshTokenExpiry: refreshExpiry,
	}
}

// GenerateAccessToken generates an access token for the user
func (js *JWTService) GenerateAccessToken(userID uint, email, role string) (string, error) {
	return js.generateToken(userID, email, role, AccessToken, js.accessTokenExpiry)
}

// GenerateRefreshToken generates a refresh token for the user
func (js *JWTService) GenerateRefreshToken(userID uint, email, role string) (string, error) {
	return js.generateToken(userID, email, role, RefreshToken, js.refreshTokenExpiry)
}

func (js *JWTService) generateToken(userID uint, email, role string, tokenType TokenType, expiry time.Duration) (string, error) {
	claims := &Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		Type:   tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(js.secretKey)
}

// ValidateToken validates a token and returns the claims
func (js *JWTService) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return js.secretKey, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidClaim
	}

	return claims, nil
}

// ValidateAccessToken validates an access token specifically
func (js *JWTService) ValidateAccessToken(tokenString string) (*Claims, error) {
	claims, err := js.ValidateToken(tokenString)
	if err != nil {
		return nil, err
	}
	if claims.Type != AccessToken {
		return nil, ErrInvalidToken
	}
	return claims, nil
}

// ValidateRefreshToken validates a refresh token specifically
func (js *JWTService) ValidateRefreshToken(tokenString string) (*Claims, error) {
	claims, err := js.ValidateToken(tokenString)
	if err != nil {
		return nil, err
	}
	if claims.Type != RefreshToken {
		return nil, ErrInvalidToken
	}
	return claims, nil
}

// TokenPair represents both access and refresh tokens
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"` // Access token expiry in seconds
}

// GenerateTokenPair generates both access and refresh tokens
func (js *JWTService) GenerateTokenPair(userID uint, email, role string) (*TokenPair, error) {
	accessToken, err := js.GenerateAccessToken(userID, email, role)
	if err != nil {
		return nil, err
	}

	refreshToken, err := js.GenerateRefreshToken(userID, email, role)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(js.accessTokenExpiry.Seconds()),
	}, nil
}
