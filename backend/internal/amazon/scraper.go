package amazon

import (
	"context"
	"fmt"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/chromedp/cdproto/cdp"
	"github.com/chromedp/chromedp"
)

// Scraper handles Amazon product scraping
type Scraper struct {
	manager *AutomationManager
	filters []FilterRule
}

// NewScraper creates a new Amazon scraper
func NewScraper(manager *AutomationManager) *Scraper {
	return &Scraper{
		manager: manager,
		filters: []FilterRule{},
	}
}

// SetFilters sets the filter rules for product search
func (s *Scraper) SetFilters(filters []FilterRule) {
	s.filters = filters
}

// SearchProducts searches for products on Amazon
func (s *Scraper) SearchProducts(params SearchParams) (*SearchResult, error) {
	ctx := s.manager.GetContext()
	if ctx == nil {
		// Initialize browser if not already done
		if err := s.manager.Initialize(); err != nil {
			return nil, fmt.Errorf("failed to initialize browser: %w", err)
		}
		ctx = s.manager.GetContext()
	}

	// Build search URL
	searchURL := s.buildSearchURL(params)

	timeoutCtx, cancel := context.WithTimeout(ctx, s.manager.GetTimeout())
	defer cancel()

	// Navigate and wait for results
	err := chromedp.Run(timeoutCtx,
		chromedp.Navigate(searchURL),
		chromedp.WaitVisible(`div[data-component-type="s-search-result"]`, chromedp.ByQuery),
	)

	if err != nil {
		// If no results visible, try waiting a bit longer
		time.Sleep(2 * time.Second)
	}

	// Extract products
	products, err := s.extractProducts(timeoutCtx)
	if err != nil {
		return nil, fmt.Errorf("failed to extract products: %w", err)
	}

	// Apply filters
	filteredProducts := s.applyFilters(products)

	s.manager.UpdateActivity()

	return &SearchResult{
		Products:   filteredProducts,
		TotalCount: len(filteredProducts),
		Page:       params.Page,
		HasMore:    len(products) >= 20,
	}, nil
}

// buildSearchURL constructs the Amazon search URL
func (s *Scraper) buildSearchURL(params SearchParams) string {
	baseURL := "https://www.amazon.com/s"
	query := url.Values{}

	query.Set("k", params.Query)

	if params.Category != "" {
		// Map category to Amazon node IDs if needed
		query.Set("i", params.Category)
	}

	if params.MinPrice > 0 {
		query.Set("p_36", fmt.Sprintf("%.0f00-", params.MinPrice))
	}

	if params.MaxPrice > 0 {
		if params.MinPrice > 0 {
			query.Set("p_36", fmt.Sprintf("%.0f00-%.0f00", params.MinPrice, params.MaxPrice))
		} else {
			query.Set("p_36", fmt.Sprintf("-%.0f00", params.MaxPrice))
		}
	}

	if params.Page > 1 {
		query.Set("page", strconv.Itoa(params.Page))
	}

	switch params.SortBy {
	case "price-asc":
		query.Set("s", "price-asc-rank")
	case "price-desc":
		query.Set("s", "price-desc-rank")
	case "rating":
		query.Set("s", "review-rank")
	case "newest":
		query.Set("s", "date-desc-rank")
	}

	return baseURL + "?" + query.Encode()
}

// extractProducts extracts product data from search results page
func (s *Scraper) extractProducts(ctx context.Context) ([]AmazonProduct, error) {
	var nodes []*cdp.Node
	var products []AmazonProduct

	// Get all search result items
	err := chromedp.Run(ctx,
		chromedp.Nodes(`div[data-component-type="s-search-result"]`, &nodes, chromedp.ByQueryAll),
	)

	if err != nil {
		return nil, err
	}

	for _, node := range nodes {
		product, err := s.extractProductFromNode(ctx, node)
		if err != nil {
			continue // Skip products we can't parse
		}
		if product.ASIN != "" && product.Title != "" {
			products = append(products, product)
		}
	}

	return products, nil
}

// extractProductFromNode extracts a single product from a DOM node
func (s *Scraper) extractProductFromNode(ctx context.Context, node *cdp.Node) (AmazonProduct, error) {
	product := AmazonProduct{
		Currency:     "USD",
		Supplier:     "Amazon",
		Availability: "In Stock",
	}

	// Get ASIN from data-asin attribute
	for _, attr := range node.Attributes {
		if attr == "data-asin" {
			// Next attribute is the value
			continue
		}
		// Check previous attr was data-asin
		for i := 0; i < len(node.Attributes)-1; i += 2 {
			if node.Attributes[i] == "data-asin" {
				product.ASIN = node.Attributes[i+1]
				break
			}
		}
	}

	// Fallback: try to find ASIN
	if product.ASIN == "" {
		var asin string
		chromedp.Run(ctx,
			chromedp.AttributeValue(`[data-asin]`, "data-asin", &asin, nil, chromedp.FromNode(node)),
		)
		product.ASIN = asin
	}

	// Extract title
	var title string
	chromedp.Run(ctx,
		chromedp.Text(`h2 a span`, &title, chromedp.FromNode(node), chromedp.ByQuery),
	)
	product.Title = strings.TrimSpace(title)

	// Extract price
	var priceWhole, priceFraction string
	chromedp.Run(ctx,
		chromedp.Text(`span.a-price-whole`, &priceWhole, chromedp.FromNode(node), chromedp.ByQuery),
	)
	chromedp.Run(ctx,
		chromedp.Text(`span.a-price-fraction`, &priceFraction, chromedp.FromNode(node), chromedp.ByQuery),
	)
	if priceWhole != "" {
		priceWhole = strings.ReplaceAll(priceWhole, ",", "")
		priceWhole = strings.ReplaceAll(priceWhole, ".", "")
		if price, err := strconv.ParseFloat(priceWhole+"."+priceFraction, 64); err == nil {
			product.Price = price
		}
	}

	// Extract rating
	var ratingText string
	chromedp.Run(ctx,
		chromedp.AttributeValue(`i.a-icon-star-small`, "class", &ratingText, nil, chromedp.FromNode(node)),
	)
	if rating := parseRating(ratingText); rating > 0 {
		product.Rating = rating
	}

	// Extract review count
	var reviewText string
	chromedp.Run(ctx,
		chromedp.Text(`span.a-size-base.s-underline-text`, &reviewText, chromedp.FromNode(node), chromedp.ByQuery),
	)
	if reviewText != "" {
		reviewText = strings.ReplaceAll(reviewText, ",", "")
		if count, err := strconv.Atoi(reviewText); err == nil {
			product.ReviewCount = count
		}
	}

	// Extract image URL
	var imgSrc string
	chromedp.Run(ctx,
		chromedp.AttributeValue(`img.s-image`, "src", &imgSrc, nil, chromedp.FromNode(node)),
	)
	product.ImageURL = imgSrc

	// Check for Prime badge
	var primeClass string
	chromedp.Run(ctx,
		chromedp.AttributeValue(`i.a-icon-prime`, "class", &primeClass, nil, chromedp.FromNode(node)),
	)
	product.IsPrime = primeClass != ""

	// Check for Best Seller badge
	var bestSellerText string
	chromedp.Run(ctx,
		chromedp.Text(`span.a-badge-text`, &bestSellerText, chromedp.FromNode(node), chromedp.ByQuery),
	)
	product.IsBestSeller = strings.Contains(strings.ToLower(bestSellerText), "best seller")

	// Build product URL
	if product.ASIN != "" {
		product.ProductURL = fmt.Sprintf("https://www.amazon.com/dp/%s", product.ASIN)
	}

	return product, nil
}

// parseRating extracts rating from class name like "a-star-small-4-5"
func parseRating(classText string) float64 {
	re := regexp.MustCompile(`a-star-small-(\d+)-?(\d*)`)
	matches := re.FindStringSubmatch(classText)
	if len(matches) >= 2 {
		whole, _ := strconv.ParseFloat(matches[1], 64)
		if len(matches) >= 3 && matches[2] != "" {
			fraction, _ := strconv.ParseFloat("0."+matches[2], 64)
			return whole + fraction
		}
		return whole
	}
	return 0
}

// applyFilters applies the configured filter rules to products
func (s *Scraper) applyFilters(products []AmazonProduct) []AmazonProduct {
	if len(s.filters) == 0 {
		return products
	}

	var filtered []AmazonProduct
	for _, product := range products {
		if s.passesFilters(product) {
			filtered = append(filtered, product)
		}
	}
	return filtered
}

// passesFilters checks if a product passes all active filters
func (s *Scraper) passesFilters(product AmazonProduct) bool {
	for _, filter := range s.filters {
		if !filter.IsActive {
			continue
		}

		switch filter.RuleType {
		case "price_max":
			maxPrice, _ := strconv.ParseFloat(filter.Value, 64)
			if product.Price > maxPrice {
				return false
			}
		case "price_min":
			minPrice, _ := strconv.ParseFloat(filter.Value, 64)
			if product.Price < minPrice {
				return false
			}
		case "category_block":
			if strings.EqualFold(product.Category, filter.Value) {
				return false
			}
		case "supplier_block":
			if strings.EqualFold(product.Supplier, filter.Value) {
				return false
			}
		case "keyword_block":
			if strings.Contains(strings.ToLower(product.Title), strings.ToLower(filter.Value)) {
				return false
			}
		}
	}
	return true
}

// GetProductDetails fetches detailed information about a specific product
func (s *Scraper) GetProductDetails(asin string) (*AmazonProduct, error) {
	ctx := s.manager.GetContext()
	if ctx == nil {
		return nil, fmt.Errorf("browser not initialized")
	}

	productURL := fmt.Sprintf("https://www.amazon.com/dp/%s", asin)

	timeoutCtx, cancel := context.WithTimeout(ctx, s.manager.GetTimeout())
	defer cancel()

	err := chromedp.Run(timeoutCtx,
		chromedp.Navigate(productURL),
		chromedp.WaitVisible(`#productTitle`, chromedp.ByID),
	)

	if err != nil {
		return nil, fmt.Errorf("failed to load product page: %w", err)
	}

	product := &AmazonProduct{
		ASIN:       asin,
		ProductURL: productURL,
		Currency:   "USD",
		Supplier:   "Amazon",
	}

	// Extract title
	var title string
	chromedp.Run(timeoutCtx,
		chromedp.Text(`#productTitle`, &title, chromedp.ByID),
	)
	product.Title = strings.TrimSpace(title)

	// Extract price
	var priceText string
	chromedp.Run(timeoutCtx,
		chromedp.Text(`span.a-price span.a-offscreen`, &priceText, chromedp.ByQuery),
	)
	if priceText != "" {
		priceText = strings.ReplaceAll(priceText, "$", "")
		priceText = strings.ReplaceAll(priceText, ",", "")
		if price, err := strconv.ParseFloat(priceText, 64); err == nil {
			product.Price = price
		}
	}

	// Extract rating
	var ratingText string
	chromedp.Run(timeoutCtx,
		chromedp.Text(`#acrPopover span.a-size-base`, &ratingText, chromedp.ByQuery),
	)
	if ratingText != "" {
		ratingText = strings.Split(ratingText, " ")[0]
		if rating, err := strconv.ParseFloat(ratingText, 64); err == nil {
			product.Rating = rating
		}
	}

	// Extract image
	var imgSrc string
	chromedp.Run(timeoutCtx,
		chromedp.AttributeValue(`#landingImage`, "src", &imgSrc, nil, chromedp.ByID),
	)
	product.ImageURL = imgSrc

	// Extract availability
	var availability string
	chromedp.Run(timeoutCtx,
		chromedp.Text(`#availability span`, &availability, chromedp.ByQuery),
	)
	product.Availability = strings.TrimSpace(availability)

	// Check Prime
	var primeClass string
	chromedp.Run(timeoutCtx,
		chromedp.AttributeValue(`#primeBadge`, "class", &primeClass, nil, chromedp.ByID),
	)
	product.IsPrime = primeClass != ""

	s.manager.UpdateActivity()

	return product, nil
}
