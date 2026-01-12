package amazon

import (
	"context"
	"fmt"
	"log"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/chromedp/cdproto/cdp"
	"github.com/chromedp/chromedp"
)

// AutomationService handles Amazon browser automation for adding items to cart
type AutomationService struct {
	ctx        context.Context
	cancel     context.CancelFunc
	mu         sync.Mutex
	isLoggedIn bool
	email      string
	password   string
	baseURL    string
}

// NewAutomationService creates a new Amazon automation service
func NewAutomationService() *AutomationService {
	return &AutomationService{
		baseURL: "https://www.amazon.com.mx",
	}
}

// Initialize starts the browser and prepares for automation
func (s *AutomationService) Initialize() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.ctx != nil {
		return nil // Already initialized
	}

	// Create browser context with options
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-blink-features", "AutomationControlled"),
		chromedp.UserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
	)

	allocCtx, _ := chromedp.NewExecAllocator(context.Background(), opts...)
	ctx, cancel := chromedp.NewContext(allocCtx, chromedp.WithLogf(log.Printf))

	s.ctx = ctx
	s.cancel = cancel

	// Navigate to Amazon to initialize session
	if err := chromedp.Run(ctx,
		chromedp.Navigate(s.baseURL),
		chromedp.WaitVisible(`body`, chromedp.ByQuery),
	); err != nil {
		s.cancel()
		s.ctx = nil
		return fmt.Errorf("failed to initialize browser: %w", err)
	}

	return nil
}

// SetCredentials sets the Amazon Business credentials
func (s *AutomationService) SetCredentials(email, password, marketplace string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.email = email
	s.password = password
	if marketplace != "" {
		s.baseURL = "https://" + marketplace
	}
}

// Login performs Amazon Business login
func (s *AutomationService) Login() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.email == "" || s.password == "" {
		return fmt.Errorf("credentials not configured")
	}

	if s.ctx == nil {
		return fmt.Errorf("browser not initialized")
	}

	ctx, cancel := context.WithTimeout(s.ctx, 60*time.Second)
	defer cancel()

	// Navigate to login page
	loginURL := s.baseURL + "/ap/signin?openid.pape.max_auth_age=0&openid.return_to=" + s.baseURL + "%2F&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=mx_flex&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0"

	if err := chromedp.Run(ctx,
		chromedp.Navigate(loginURL),
		chromedp.WaitVisible(`#ap_email`, chromedp.ByID),
	); err != nil {
		return fmt.Errorf("failed to load login page: %w", err)
	}

	// Enter email
	if err := chromedp.Run(ctx,
		chromedp.SendKeys(`#ap_email`, s.email, chromedp.ByID),
		chromedp.Click(`#continue`, chromedp.ByID),
		chromedp.WaitVisible(`#ap_password`, chromedp.ByID),
	); err != nil {
		return fmt.Errorf("failed to enter email: %w", err)
	}

	// Enter password
	if err := chromedp.Run(ctx,
		chromedp.SendKeys(`#ap_password`, s.password, chromedp.ByID),
		chromedp.Click(`#signInSubmit`, chromedp.ByID),
	); err != nil {
		return fmt.Errorf("failed to enter password: %w", err)
	}

	// Wait for successful login (check for nav-logo or account menu)
	if err := chromedp.Run(ctx,
		chromedp.WaitVisible(`#nav-logo-sprites, #nav-link-accountList`, chromedp.ByQuery),
	); err != nil {
		return fmt.Errorf("login may have failed - could not verify: %w", err)
	}

	s.isLoggedIn = true
	log.Printf("Successfully logged in to Amazon Business as %s", s.email)

	return nil
}

// AddToCart adds a product to the Amazon cart
func (s *AutomationService) AddToCart(productURL string, quantity int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.ctx == nil {
		return fmt.Errorf("browser not initialized")
	}

	if !s.isLoggedIn {
		return fmt.Errorf("not logged in to Amazon")
	}

	ctx, cancel := context.WithTimeout(s.ctx, 45*time.Second)
	defer cancel()

	// Navigate to product page
	if err := chromedp.Run(ctx,
		chromedp.Navigate(productURL),
		chromedp.WaitVisible(`body`, chromedp.ByQuery),
	); err != nil {
		return fmt.Errorf("failed to load product page: %w", err)
	}

	// Wait for the page to fully load
	time.Sleep(2 * time.Second)

	// Set quantity if greater than 1
	if quantity > 1 {
		// Try to find and set quantity selector
		var nodes []*cdp.Node
		if err := chromedp.Run(ctx,
			chromedp.Nodes(`#quantity, select[name="quantity"]`, &nodes, chromedp.ByQuery),
		); err == nil && len(nodes) > 0 {
			qtyStr := fmt.Sprintf("%d", quantity)
			chromedp.Run(ctx,
				chromedp.SetValue(`#quantity, select[name="quantity"]`, qtyStr, chromedp.ByQuery),
			)
		}
	}

	// Try different "Add to Cart" button selectors
	addToCartSelectors := []string{
		`#add-to-cart-button`,
		`#add-to-cart-button-ubb`,
		`input[name="submit.add-to-cart"]`,
		`#turbo-checkout-pyo-button`,
		`#one-click-button`,
	}

	var addedToCart bool
	for _, selector := range addToCartSelectors {
		var nodes []*cdp.Node
		if err := chromedp.Run(ctx,
			chromedp.Nodes(selector, &nodes, chromedp.ByQuery),
		); err == nil && len(nodes) > 0 {
			if err := chromedp.Run(ctx,
				chromedp.Click(selector, chromedp.ByQuery),
			); err == nil {
				addedToCart = true
				break
			}
		}
	}

	if !addedToCart {
		return fmt.Errorf("could not find add-to-cart button")
	}

	// Wait for cart confirmation
	time.Sleep(3 * time.Second)

	// Check for success indicators
	successSelectors := []string{
		`#huc-v2-order-row-confirm-text`,
		`#NATC_SMART_WAGON_CONF_MSG_SUCCESS`,
		`#sw-atc-confirmation`,
		`#hlb-ptc-btn`,
	}

	for _, selector := range successSelectors {
		var nodes []*cdp.Node
		if err := chromedp.Run(ctx,
			chromedp.Nodes(selector, &nodes, chromedp.ByQuery),
		); err == nil && len(nodes) > 0 {
			log.Printf("Product successfully added to cart")
			return nil
		}
	}

	// If we got here without error, assume success
	log.Printf("Product add-to-cart action completed")
	return nil
}

// ExtractASIN extracts the ASIN from an Amazon URL
func ExtractASIN(url string) string {
	// Pattern 1: /dp/ASIN
	re1 := regexp.MustCompile(`/dp/([A-Z0-9]{10})`)
	if matches := re1.FindStringSubmatch(url); len(matches) > 1 {
		return matches[1]
	}

	// Pattern 2: /gp/product/ASIN
	re2 := regexp.MustCompile(`/gp/product/([A-Z0-9]{10})`)
	if matches := re2.FindStringSubmatch(url); len(matches) > 1 {
		return matches[1]
	}

	// Pattern 3: /ASIN/
	re3 := regexp.MustCompile(`/([A-Z0-9]{10})(?:/|$|\?)`)
	if matches := re3.FindStringSubmatch(url); len(matches) > 1 {
		return matches[1]
	}

	return ""
}

// IsAmazonURL checks if a URL is from Amazon
func IsAmazonURL(url string) bool {
	lowerURL := strings.ToLower(url)
	return strings.Contains(lowerURL, "amazon.com") ||
		strings.Contains(lowerURL, "amazon.com.mx") ||
		strings.Contains(lowerURL, "amazon.co") ||
		strings.Contains(lowerURL, "amzn.to") ||
		strings.Contains(lowerURL, "a.co")
}

// GetSessionStatus returns the current session status
func (s *AutomationService) GetSessionStatus() map[string]interface{} {
	s.mu.Lock()
	defer s.mu.Unlock()

	return map[string]interface{}{
		"initialized": s.ctx != nil,
		"logged_in":   s.isLoggedIn,
		"email":       s.email,
		"base_url":    s.baseURL,
	}
}

// Close cleans up browser resources
func (s *AutomationService) Close() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.cancel != nil {
		s.cancel()
		s.ctx = nil
		s.cancel = nil
		s.isLoggedIn = false
	}
}

// IsLoggedIn returns whether the service is logged in
func (s *AutomationService) IsLoggedIn() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.isLoggedIn
}
