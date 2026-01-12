package metadata

import (
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// ProductMetadata contains extracted metadata from a product URL
type ProductMetadata struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	ImageURL    string   `json:"image_url"`
	Price       *float64 `json:"price,omitempty"`
	Currency    string   `json:"currency,omitempty"`
	SiteName    string   `json:"site_name,omitempty"`
}

// Extractor extracts metadata from product URLs
type Extractor struct {
	client *http.Client
}

// NewExtractor creates a new metadata extractor
func NewExtractor() *Extractor {
	return &Extractor{
		client: &http.Client{
			Timeout: 15 * time.Second,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				if len(via) >= 5 {
					return fmt.Errorf("too many redirects")
				}
				return nil
			},
		},
	}
}

// ExtractFromURL extracts product metadata from a given URL
func (e *Extractor) ExtractFromURL(url string) (*ProductMetadata, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers to appear as a regular browser
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "es-MX,es;q=0.9,en;q=0.8")

	resp, err := e.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch URL: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	metadata := &ProductMetadata{}

	// 1. Try Open Graph tags first (og:*)
	metadata.Title = e.getMetaContent(doc, "og:title")
	metadata.Description = e.getMetaContent(doc, "og:description")
	metadata.ImageURL = e.getMetaContent(doc, "og:image")
	metadata.SiteName = e.getMetaContent(doc, "og:site_name")

	// Try to get price from og:price:amount
	if priceStr := e.getMetaContent(doc, "og:price:amount"); priceStr != "" {
		if price, err := e.parsePrice(priceStr); err == nil {
			metadata.Price = &price
		}
	}
	metadata.Currency = e.getMetaContent(doc, "og:price:currency")

	// 2. Fallback to Twitter Card tags
	if metadata.Title == "" {
		metadata.Title = e.getMetaContent(doc, "twitter:title")
	}
	if metadata.Description == "" {
		metadata.Description = e.getMetaContent(doc, "twitter:description")
	}
	if metadata.ImageURL == "" {
		metadata.ImageURL = e.getMetaContent(doc, "twitter:image")
	}

	// 3. Fallback to standard meta tags
	if metadata.Title == "" {
		metadata.Title = e.getMetaName(doc, "title")
	}
	if metadata.Description == "" {
		metadata.Description = e.getMetaName(doc, "description")
	}

	// 4. Fallback to <title> tag
	if metadata.Title == "" {
		metadata.Title = strings.TrimSpace(doc.Find("title").First().Text())
	}

	// 5. Try to find first significant image if no image yet
	if metadata.ImageURL == "" {
		metadata.ImageURL = e.findFirstSignificantImage(doc, url)
	}

	// 6. Site-specific extractors
	e.extractSiteSpecific(doc, url, metadata)

	// Clean up title (remove site name suffix if present)
	metadata.Title = e.cleanTitle(metadata.Title, metadata.SiteName)

	return metadata, nil
}

// getMetaContent gets content from meta property tags (og:*, product:*)
func (e *Extractor) getMetaContent(doc *goquery.Document, property string) string {
	var content string
	doc.Find(fmt.Sprintf(`meta[property="%s"]`, property)).Each(func(i int, s *goquery.Selection) {
		if c, exists := s.Attr("content"); exists && content == "" {
			content = strings.TrimSpace(c)
		}
	})
	return content
}

// getMetaName gets content from meta name tags
func (e *Extractor) getMetaName(doc *goquery.Document, name string) string {
	var content string
	doc.Find(fmt.Sprintf(`meta[name="%s"]`, name)).Each(func(i int, s *goquery.Selection) {
		if c, exists := s.Attr("content"); exists && content == "" {
			content = strings.TrimSpace(c)
		}
	})
	return content
}

// findFirstSignificantImage finds the first image that appears to be a product image
func (e *Extractor) findFirstSignificantImage(doc *goquery.Document, baseURL string) string {
	var imageURL string

	// Look for common product image selectors
	selectors := []string{
		"#landingImage",                    // Amazon
		"#imgBlkFront",                     // Amazon alternative
		".product-image img",               // Generic
		".gallery-image img",               // Generic gallery
		"[data-main-image]",                // Data attribute
		".product img",                     // Generic product
		"article img",                      // Article main image
		".main-image img",                  // Main image class
		"picture source",                   // Picture element
	}

	for _, selector := range selectors {
		doc.Find(selector).Each(func(i int, s *goquery.Selection) {
			if imageURL != "" {
				return
			}

			// Try different attributes
			for _, attr := range []string{"src", "data-src", "srcset", "data-a-dynamic-image"} {
				if src, exists := s.Attr(attr); exists && src != "" {
					// Handle srcset (take first URL)
					if attr == "srcset" {
						parts := strings.Split(src, ",")
						if len(parts) > 0 {
							src = strings.Fields(parts[0])[0]
						}
					}
					// Handle data-a-dynamic-image (Amazon JSON)
					if attr == "data-a-dynamic-image" {
						src = e.extractAmazonImageFromJSON(src)
					}
					if src != "" && !strings.HasPrefix(src, "data:") {
						imageURL = e.makeAbsoluteURL(src, baseURL)
						return
					}
				}
			}
		})
		if imageURL != "" {
			break
		}
	}

	return imageURL
}

// extractSiteSpecific handles site-specific extraction logic
func (e *Extractor) extractSiteSpecific(doc *goquery.Document, url string, metadata *ProductMetadata) {
	lowerURL := strings.ToLower(url)

	// Amazon
	if strings.Contains(lowerURL, "amazon.com") || strings.Contains(lowerURL, "amazon.com.mx") {
		e.extractAmazon(doc, metadata)
	}

	// MercadoLibre
	if strings.Contains(lowerURL, "mercadolibre.com") || strings.Contains(lowerURL, "mercadolibre.com.mx") {
		e.extractMercadoLibre(doc, metadata)
	}

	// Default currency if not set
	if metadata.Currency == "" {
		if strings.Contains(lowerURL, ".mx") {
			metadata.Currency = "MXN"
		} else if strings.Contains(lowerURL, ".com") {
			metadata.Currency = "USD"
		}
	}
}

// extractAmazon extracts Amazon-specific data
func (e *Extractor) extractAmazon(doc *goquery.Document, metadata *ProductMetadata) {
	// Title from product title
	if metadata.Title == "" {
		metadata.Title = strings.TrimSpace(doc.Find("#productTitle").Text())
	}

	// Price
	if metadata.Price == nil {
		// Try different price selectors
		priceSelectors := []string{
			".a-price .a-offscreen",
			"#priceblock_ourprice",
			"#priceblock_dealprice",
			".a-price-whole",
			"#price_inside_buybox",
		}
		for _, selector := range priceSelectors {
			if priceText := strings.TrimSpace(doc.Find(selector).First().Text()); priceText != "" {
				if price, err := e.parsePrice(priceText); err == nil {
					metadata.Price = &price
					break
				}
			}
		}
	}

	// Image
	if metadata.ImageURL == "" {
		if src, exists := doc.Find("#landingImage").Attr("src"); exists {
			metadata.ImageURL = src
		}
	}

	if metadata.SiteName == "" {
		metadata.SiteName = "Amazon"
	}
}

// extractMercadoLibre extracts MercadoLibre-specific data
func (e *Extractor) extractMercadoLibre(doc *goquery.Document, metadata *ProductMetadata) {
	// Title
	if metadata.Title == "" {
		metadata.Title = strings.TrimSpace(doc.Find(".ui-pdp-title").Text())
	}

	// Price
	if metadata.Price == nil {
		priceText := strings.TrimSpace(doc.Find(".andes-money-amount__fraction").First().Text())
		if priceText != "" {
			if price, err := e.parsePrice(priceText); err == nil {
				metadata.Price = &price
			}
		}
	}

	// Image
	if metadata.ImageURL == "" {
		if src, exists := doc.Find(".ui-pdp-image").Attr("src"); exists {
			metadata.ImageURL = src
		}
	}

	if metadata.SiteName == "" {
		metadata.SiteName = "MercadoLibre"
	}

	if metadata.Currency == "" {
		metadata.Currency = "MXN"
	}
}

// parsePrice parses a price string into a float64
func (e *Extractor) parsePrice(priceStr string) (float64, error) {
	// Remove currency symbols and whitespace
	priceStr = strings.TrimSpace(priceStr)

	// Remove common currency symbols and characters
	replacer := strings.NewReplacer(
		"$", "", "USD", "", "MXN", "", "€", "", "£", "",
		",", "", " ", "", "\u00a0", "", // non-breaking space
	)
	priceStr = replacer.Replace(priceStr)

	// Extract numeric value using regex
	re := regexp.MustCompile(`[\d.]+`)
	matches := re.FindString(priceStr)
	if matches == "" {
		return 0, fmt.Errorf("no numeric value found in: %s", priceStr)
	}

	return strconv.ParseFloat(matches, 64)
}

// makeAbsoluteURL converts a relative URL to absolute
func (e *Extractor) makeAbsoluteURL(src, baseURL string) string {
	if strings.HasPrefix(src, "http://") || strings.HasPrefix(src, "https://") {
		return src
	}
	if strings.HasPrefix(src, "//") {
		return "https:" + src
	}
	if strings.HasPrefix(src, "/") {
		// Extract base domain from URL
		re := regexp.MustCompile(`^(https?://[^/]+)`)
		if matches := re.FindStringSubmatch(baseURL); len(matches) > 1 {
			return matches[1] + src
		}
	}
	return src
}

// extractAmazonImageFromJSON extracts image URL from Amazon's data-a-dynamic-image JSON
func (e *Extractor) extractAmazonImageFromJSON(jsonStr string) string {
	// Simple extraction - find first URL in the JSON
	re := regexp.MustCompile(`"(https://[^"]+)"`)
	matches := re.FindStringSubmatch(jsonStr)
	if len(matches) > 1 {
		return matches[1]
	}
	return ""
}

// cleanTitle removes site name suffix from title
func (e *Extractor) cleanTitle(title, siteName string) string {
	if siteName == "" || title == "" {
		return title
	}

	// Common separators
	separators := []string{" - ", " | ", " – ", " — "}
	for _, sep := range separators {
		if idx := strings.LastIndex(title, sep); idx > 0 {
			suffix := strings.TrimSpace(title[idx+len(sep):])
			if strings.EqualFold(suffix, siteName) || strings.Contains(strings.ToLower(suffix), strings.ToLower(siteName)) {
				title = strings.TrimSpace(title[:idx])
			}
		}
	}

	return title
}
