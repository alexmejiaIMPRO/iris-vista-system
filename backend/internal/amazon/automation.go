package amazon

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/chromedp/chromedp"
)

// AutomationManager manages the Amazon automation browser instance
type AutomationManager struct {
	ctx          context.Context
	cancel       context.CancelFunc
	allocCtx     context.Context
	allocCancel  context.CancelFunc
	isLoggedIn   bool
	lastActivity time.Time
	mu           sync.RWMutex
	config       *Config
}

// Config holds Amazon Business credentials and settings
type Config struct {
	Username              string
	Password              string
	AccountID             string
	BusinessGroup         string
	DefaultShippingAddr   string
	Headless              bool
	Timeout               time.Duration
}

var (
	manager *AutomationManager
	once    sync.Once
)

// GetManager returns the singleton automation manager instance
func GetManager() *AutomationManager {
	once.Do(func() {
		manager = &AutomationManager{
			config: &Config{
				Headless: true,
				Timeout:  60 * time.Second, // Increased timeout for browser initialization
			},
		}
	})
	return manager
}

// Configure sets the Amazon credentials
func (m *AutomationManager) Configure(cfg *Config) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.config = cfg
	if m.config.Timeout == 0 {
		m.config.Timeout = 30 * time.Second
	}
}

// GetConfig returns the current configuration (without password)
func (m *AutomationManager) GetConfig() *Config {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if m.config == nil {
		return nil
	}
	return &Config{
		Username:            m.config.Username,
		AccountID:           m.config.AccountID,
		BusinessGroup:       m.config.BusinessGroup,
		DefaultShippingAddr: m.config.DefaultShippingAddr,
		Headless:            m.config.Headless,
		Timeout:             m.config.Timeout,
	}
}

// Initialize starts the browser context
func (m *AutomationManager) Initialize() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Cancel any existing context
	if m.cancel != nil {
		m.cancel()
	}
	if m.allocCancel != nil {
		m.allocCancel()
	}

	// Create allocator options
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", m.config.Headless),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-blink-features", "AutomationControlled"),
		chromedp.UserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
	)

	// Create allocator context
	m.allocCtx, m.allocCancel = chromedp.NewExecAllocator(context.Background(), opts...)

	// Create browser context
	m.ctx, m.cancel = chromedp.NewContext(m.allocCtx, chromedp.WithLogf(log.Printf))

	m.lastActivity = time.Now()
	return nil
}

// Login performs Amazon Business login
func (m *AutomationManager) Login() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.ctx == nil {
		return fmt.Errorf("browser not initialized")
	}

	if m.config.Username == "" || m.config.Password == "" {
		return fmt.Errorf("credentials not configured")
	}

	ctx, cancel := context.WithTimeout(m.ctx, m.config.Timeout*2)
	defer cancel()

	// Navigate to Amazon Business login
	err := chromedp.Run(ctx,
		chromedp.Navigate("https://www.amazon.com/ap/signin?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.com%2Fb2b%2F"),
		chromedp.WaitVisible(`#ap_email`, chromedp.ByID),
		chromedp.SendKeys(`#ap_email`, m.config.Username, chromedp.ByID),
		chromedp.Click(`#continue`, chromedp.ByID),
		chromedp.WaitVisible(`#ap_password`, chromedp.ByID),
		chromedp.SendKeys(`#ap_password`, m.config.Password, chromedp.ByID),
		chromedp.Click(`#signInSubmit`, chromedp.ByID),
		chromedp.Sleep(3*time.Second),
	)

	if err != nil {
		return fmt.Errorf("login failed: %w", err)
	}

	m.isLoggedIn = true
	m.lastActivity = time.Now()
	return nil
}

// IsLoggedIn returns whether the session is active
func (m *AutomationManager) IsLoggedIn() bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.isLoggedIn
}

// GetContext returns the browser context for operations
func (m *AutomationManager) GetContext() context.Context {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.ctx
}

// GetTimeout returns the configured timeout
func (m *AutomationManager) GetTimeout() time.Duration {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.config.Timeout
}

// UpdateActivity updates the last activity timestamp
func (m *AutomationManager) UpdateActivity() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.lastActivity = time.Now()
}

// Close shuts down the browser
func (m *AutomationManager) Close() {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.cancel != nil {
		m.cancel()
		m.cancel = nil
	}
	if m.allocCancel != nil {
		m.allocCancel()
		m.allocCancel = nil
	}
	m.ctx = nil
	m.allocCtx = nil
	m.isLoggedIn = false
}

// GetSessionInfo returns current session information
func (m *AutomationManager) GetSessionInfo() SessionInfo {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return SessionInfo{
		IsLoggedIn:   m.isLoggedIn,
		Username:     m.config.Username,
		LastLoginAt:  m.lastActivity,
		SessionValid: m.ctx != nil,
	}
}

// TestConnection tests if we can connect to Amazon
func (m *AutomationManager) TestConnection() error {
	if m.ctx == nil {
		if err := m.Initialize(); err != nil {
			return fmt.Errorf("failed to initialize browser: %w", err)
		}
	}

	ctx, cancel := context.WithTimeout(m.ctx, m.config.Timeout)
	defer cancel()

	var title string
	err := chromedp.Run(ctx,
		chromedp.Navigate("https://www.amazon.com"),
		chromedp.Title(&title),
	)

	if err != nil {
		return fmt.Errorf("connection test failed: %w", err)
	}

	if title == "" {
		return fmt.Errorf("could not load Amazon page")
	}

	return nil
}
