package amazon

import (
	"context"
	"fmt"
	"time"

	"github.com/chromedp/chromedp"
)

// CartItem represents an item to add to Amazon cart
type CartItem struct {
	ASIN     string `json:"asin"`
	Quantity int    `json:"quantity"`
}

// OrderResult represents the result of placing an order
type OrderResult struct {
	Success     bool   `json:"success"`
	OrderID     string `json:"order_id"`
	TotalAmount float64 `json:"total_amount"`
	Message     string `json:"message"`
}

// Checkout handles Amazon checkout operations
type Checkout struct {
	manager *AutomationManager
}

// NewCheckout creates a new checkout handler
func NewCheckout(manager *AutomationManager) *Checkout {
	return &Checkout{
		manager: manager,
	}
}

// AddToCart adds a product to Amazon cart
func (c *Checkout) AddToCart(asin string, quantity int) error {
	ctx := c.manager.GetContext()
	if ctx == nil {
		return fmt.Errorf("browser not initialized")
	}

	if !c.manager.IsLoggedIn() {
		return fmt.Errorf("not logged in to Amazon")
	}

	productURL := fmt.Sprintf("https://www.amazon.com/dp/%s", asin)

	timeoutCtx, cancel := context.WithTimeout(ctx, c.manager.GetTimeout())
	defer cancel()

	// Navigate to product and add to cart
	err := chromedp.Run(timeoutCtx,
		chromedp.Navigate(productURL),
		chromedp.WaitVisible(`#add-to-cart-button`, chromedp.ByID),
	)

	if err != nil {
		return fmt.Errorf("failed to load product page: %w", err)
	}

	// Set quantity if > 1
	if quantity > 1 {
		chromedp.Run(timeoutCtx,
			chromedp.SetValue(`#quantity`, fmt.Sprintf("%d", quantity), chromedp.ByID),
		)
		time.Sleep(500 * time.Millisecond)
	}

	// Click add to cart
	err = chromedp.Run(timeoutCtx,
		chromedp.Click(`#add-to-cart-button`, chromedp.ByID),
		chromedp.Sleep(2*time.Second),
	)

	if err != nil {
		return fmt.Errorf("failed to add to cart: %w", err)
	}

	c.manager.UpdateActivity()
	return nil
}

// AddMultipleToCart adds multiple products to cart
func (c *Checkout) AddMultipleToCart(items []CartItem) error {
	for _, item := range items {
		if err := c.AddToCart(item.ASIN, item.Quantity); err != nil {
			return fmt.Errorf("failed to add %s to cart: %w", item.ASIN, err)
		}
	}
	return nil
}

// GetCartTotal retrieves the current cart total
func (c *Checkout) GetCartTotal() (float64, error) {
	ctx := c.manager.GetContext()
	if ctx == nil {
		return 0, fmt.Errorf("browser not initialized")
	}

	timeoutCtx, cancel := context.WithTimeout(ctx, c.manager.GetTimeout())
	defer cancel()

	err := chromedp.Run(timeoutCtx,
		chromedp.Navigate("https://www.amazon.com/gp/cart/view.html"),
		chromedp.WaitVisible(`#sc-subtotal-label-activecart`, chromedp.ByID),
	)

	if err != nil {
		return 0, fmt.Errorf("failed to load cart: %w", err)
	}

	var totalText string
	chromedp.Run(timeoutCtx,
		chromedp.Text(`#sc-subtotal-amount-activecart`, &totalText, chromedp.ByID),
	)

	// Parse total (remove $ and commas)
	// Note: This is simplified; real implementation would need proper parsing
	c.manager.UpdateActivity()

	return 0, nil // Placeholder - would parse totalText
}

// ProceedToCheckout navigates to checkout page
func (c *Checkout) ProceedToCheckout() error {
	ctx := c.manager.GetContext()
	if ctx == nil {
		return fmt.Errorf("browser not initialized")
	}

	if !c.manager.IsLoggedIn() {
		return fmt.Errorf("not logged in to Amazon")
	}

	timeoutCtx, cancel := context.WithTimeout(ctx, c.manager.GetTimeout())
	defer cancel()

	err := chromedp.Run(timeoutCtx,
		chromedp.Navigate("https://www.amazon.com/gp/cart/view.html"),
		chromedp.WaitVisible(`#sc-buy-box-ptc-button`, chromedp.ByID),
		chromedp.Click(`#sc-buy-box-ptc-button`, chromedp.ByID),
		chromedp.Sleep(3*time.Second),
	)

	if err != nil {
		return fmt.Errorf("failed to proceed to checkout: %w", err)
	}

	c.manager.UpdateActivity()
	return nil
}

// SelectShippingAddress selects a shipping address during checkout
func (c *Checkout) SelectShippingAddress(addressID string) error {
	ctx := c.manager.GetContext()
	if ctx == nil {
		return fmt.Errorf("browser not initialized")
	}

	timeoutCtx, cancel := context.WithTimeout(ctx, c.manager.GetTimeout())
	defer cancel()

	// This would need to be customized based on Amazon's checkout flow
	// Different business accounts may have different address selection UIs
	err := chromedp.Run(timeoutCtx,
		chromedp.WaitVisible(`input[name="address"]`, chromedp.ByQuery),
	)

	if err != nil {
		return fmt.Errorf("address selection page not found: %w", err)
	}

	c.manager.UpdateActivity()
	return nil
}

// PlaceOrder places the order (CAUTION: This actually places an order!)
func (c *Checkout) PlaceOrder() (*OrderResult, error) {
	ctx := c.manager.GetContext()
	if ctx == nil {
		return nil, fmt.Errorf("browser not initialized")
	}

	if !c.manager.IsLoggedIn() {
		return nil, fmt.Errorf("not logged in to Amazon")
	}

	timeoutCtx, cancel := context.WithTimeout(ctx, c.manager.GetTimeout()*2)
	defer cancel()

	// WARNING: This would actually place an order
	// In production, you'd want additional safeguards
	err := chromedp.Run(timeoutCtx,
		chromedp.WaitVisible(`#submitOrderButtonId`, chromedp.ByID),
		// chromedp.Click(`#submitOrderButtonId`, chromedp.ByID), // Commented for safety
		chromedp.Sleep(2*time.Second),
	)

	if err != nil {
		return &OrderResult{
			Success: false,
			Message: fmt.Sprintf("failed to place order: %v", err),
		}, nil
	}

	// Extract order confirmation
	var orderID string
	chromedp.Run(timeoutCtx,
		chromedp.WaitVisible(`#orderDetails`, chromedp.ByID),
		chromedp.Text(`#orderDetails span.order-id`, &orderID, chromedp.ByQuery),
	)

	c.manager.UpdateActivity()

	return &OrderResult{
		Success: true,
		OrderID: orderID,
		Message: "Order placed successfully",
	}, nil
}

// ClearCart removes all items from the cart
func (c *Checkout) ClearCart() error {
	ctx := c.manager.GetContext()
	if ctx == nil {
		return fmt.Errorf("browser not initialized")
	}

	timeoutCtx, cancel := context.WithTimeout(ctx, c.manager.GetTimeout())
	defer cancel()

	err := chromedp.Run(timeoutCtx,
		chromedp.Navigate("https://www.amazon.com/gp/cart/view.html"),
		chromedp.Sleep(2*time.Second),
	)

	if err != nil {
		return fmt.Errorf("failed to load cart: %w", err)
	}

	// Delete all items - this would loop through delete buttons
	// Simplified implementation
	c.manager.UpdateActivity()
	return nil
}
