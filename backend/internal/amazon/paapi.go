package amazon

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"
	"time"
)

// PAAPIClient handles Amazon Product Advertising API requests
type PAAPIClient struct {
	AccessKey   string
	SecretKey   string
	PartnerTag  string
	Region      string
	Marketplace string
}

// NewPAAPIClient creates a new PA-API client
func NewPAAPIClient(accessKey, secretKey, partnerTag, region, marketplace string) *PAAPIClient {
	if region == "" {
		region = "us-east-1"
	}
	if marketplace == "" {
		marketplace = "www.amazon.com"
	}
	return &PAAPIClient{
		AccessKey:   accessKey,
		SecretKey:   secretKey,
		PartnerTag:  partnerTag,
		Region:      region,
		Marketplace: marketplace,
	}
}

// SearchItemsRequest represents a search request
type SearchItemsRequest struct {
	Keywords     string   `json:"Keywords"`
	SearchIndex  string   `json:"SearchIndex,omitempty"`
	ItemCount    int      `json:"ItemCount,omitempty"`
	ItemPage     int      `json:"ItemPage,omitempty"`
	MinPrice     int      `json:"MinPrice,omitempty"` // In cents
	MaxPrice     int      `json:"MaxPrice,omitempty"` // In cents
	SortBy       string   `json:"SortBy,omitempty"`
	PartnerTag   string   `json:"PartnerTag"`
	PartnerType  string   `json:"PartnerType"`
	Marketplace  string   `json:"Marketplace"`
	Resources    []string `json:"Resources"`
}

// SearchItemsResponse represents the PA-API search response
type SearchItemsResponse struct {
	SearchResult struct {
		TotalResultCount int `json:"TotalResultCount"`
		Items            []PAAPIItem `json:"Items"`
	} `json:"SearchResult"`
	Errors []struct {
		Code    string `json:"Code"`
		Message string `json:"Message"`
	} `json:"Errors"`
}

// PAAPIItem represents a product from PA-API
type PAAPIItem struct {
	ASIN       string `json:"ASIN"`
	DetailPageURL string `json:"DetailPageURL"`
	ItemInfo   struct {
		Title struct {
			DisplayValue string `json:"DisplayValue"`
		} `json:"Title"`
		Features struct {
			DisplayValues []string `json:"DisplayValues"`
		} `json:"Features"`
		ProductInfo struct {
			ItemDimensions struct {
				Height struct {
					DisplayValue float64 `json:"DisplayValue"`
					Unit         string  `json:"Unit"`
				} `json:"Height"`
			} `json:"ItemDimensions"`
		} `json:"ProductInfo"`
		Classifications struct {
			Binding struct {
				DisplayValue string `json:"DisplayValue"`
			} `json:"Binding"`
			ProductGroup struct {
				DisplayValue string `json:"DisplayValue"`
			} `json:"ProductGroup"`
		} `json:"Classifications"`
		ByLineInfo struct {
			Brand struct {
				DisplayValue string `json:"DisplayValue"`
			} `json:"Brand"`
			Manufacturer struct {
				DisplayValue string `json:"DisplayValue"`
			} `json:"Manufacturer"`
		} `json:"ByLineInfo"`
	} `json:"ItemInfo"`
	Images struct {
		Primary struct {
			Large struct {
				URL    string `json:"URL"`
				Height int    `json:"Height"`
				Width  int    `json:"Width"`
			} `json:"Large"`
			Medium struct {
				URL string `json:"URL"`
			} `json:"Medium"`
		} `json:"Primary"`
	} `json:"Images"`
	Offers struct {
		Listings []struct {
			Price struct {
				Amount        float64 `json:"Amount"`
				Currency      string  `json:"Currency"`
				DisplayAmount string  `json:"DisplayAmount"`
			} `json:"Price"`
			DeliveryInfo struct {
				IsPrimeEligible bool `json:"IsPrimeEligible"`
			} `json:"DeliveryInfo"`
			Availability struct {
				Message string `json:"Message"`
			} `json:"Availability"`
		} `json:"Listings"`
	} `json:"Offers"`
	CustomerReviews struct {
		Count      int     `json:"Count"`
		StarRating struct {
			Value float64 `json:"Value"`
		} `json:"StarRating"`
	} `json:"CustomerReviews"`
	BrowseNodeInfo struct {
		BrowseNodes []struct {
			DisplayName string `json:"DisplayName"`
			Id          string `json:"Id"`
		} `json:"BrowseNodes"`
	} `json:"BrowseNodeInfo"`
}

// SearchProducts searches for products using PA-API
func (c *PAAPIClient) SearchProducts(params SearchParams) (*SearchResult, error) {
	// Build request
	req := SearchItemsRequest{
		Keywords:    params.Query,
		SearchIndex: "All",
		ItemCount:   20,
		ItemPage:    params.Page,
		PartnerTag:  c.PartnerTag,
		PartnerType: "Associates",
		Marketplace: c.Marketplace,
		Resources: []string{
			"ItemInfo.Title",
			"ItemInfo.Features",
			"ItemInfo.ProductInfo",
			"ItemInfo.Classifications",
			"ItemInfo.ByLineInfo",
			"Images.Primary.Large",
			"Images.Primary.Medium",
			"Offers.Listings.Price",
			"Offers.Listings.DeliveryInfo",
			"Offers.Listings.Availability",
			"CustomerReviews.Count",
			"CustomerReviews.StarRating",
			"BrowseNodeInfo.BrowseNodes",
		},
	}

	if params.Category != "" {
		req.SearchIndex = mapCategoryToSearchIndex(params.Category)
	}
	if params.MinPrice > 0 {
		req.MinPrice = int(params.MinPrice * 100) // Convert to cents
	}
	if params.MaxPrice > 0 {
		req.MaxPrice = int(params.MaxPrice * 100)
	}
	if params.SortBy != "" {
		req.SortBy = mapSortBy(params.SortBy)
	}
	if req.ItemPage < 1 {
		req.ItemPage = 1
	}

	// Make API call
	resp, err := c.makeRequest("SearchItems", req)
	if err != nil {
		return nil, fmt.Errorf("PA-API request failed: %w", err)
	}

	var searchResp SearchItemsResponse
	if err := json.Unmarshal(resp, &searchResp); err != nil {
		return nil, fmt.Errorf("failed to parse PA-API response: %w", err)
	}

	if len(searchResp.Errors) > 0 {
		return nil, fmt.Errorf("PA-API error: %s - %s", searchResp.Errors[0].Code, searchResp.Errors[0].Message)
	}

	// Convert to our format
	products := make([]AmazonProduct, len(searchResp.SearchResult.Items))
	for i, item := range searchResp.SearchResult.Items {
		products[i] = convertPAAPIItem(item)
	}

	return &SearchResult{
		Products:   products,
		TotalCount: searchResp.SearchResult.TotalResultCount,
		Page:       params.Page,
		HasMore:    params.Page*20 < searchResp.SearchResult.TotalResultCount,
	}, nil
}

// GetItem gets a single item by ASIN
func (c *PAAPIClient) GetItem(asin string) (*AmazonProduct, error) {
	reqBody := map[string]interface{}{
		"ItemIds":     []string{asin},
		"PartnerTag":  c.PartnerTag,
		"PartnerType": "Associates",
		"Marketplace": c.Marketplace,
		"Resources": []string{
			"ItemInfo.Title",
			"ItemInfo.Features",
			"ItemInfo.ProductInfo",
			"ItemInfo.Classifications",
			"ItemInfo.ByLineInfo",
			"Images.Primary.Large",
			"Images.Primary.Medium",
			"Offers.Listings.Price",
			"Offers.Listings.DeliveryInfo",
			"Offers.Listings.Availability",
			"CustomerReviews.Count",
			"CustomerReviews.StarRating",
			"BrowseNodeInfo.BrowseNodes",
		},
	}

	resp, err := c.makeRequest("GetItems", reqBody)
	if err != nil {
		return nil, err
	}

	var getResp struct {
		ItemsResult struct {
			Items []PAAPIItem `json:"Items"`
		} `json:"ItemsResult"`
		Errors []struct {
			Code    string `json:"Code"`
			Message string `json:"Message"`
		} `json:"Errors"`
	}

	if err := json.Unmarshal(resp, &getResp); err != nil {
		return nil, err
	}

	if len(getResp.Errors) > 0 {
		return nil, fmt.Errorf("PA-API error: %s", getResp.Errors[0].Message)
	}

	if len(getResp.ItemsResult.Items) == 0 {
		return nil, fmt.Errorf("item not found: %s", asin)
	}

	product := convertPAAPIItem(getResp.ItemsResult.Items[0])
	return &product, nil
}

func (c *PAAPIClient) makeRequest(operation string, payload interface{}) ([]byte, error) {
	host := getHost(c.Region)
	endpoint := fmt.Sprintf("https://%s/paapi5/%s", host, strings.ToLower(operation))
	service := "ProductAdvertisingAPI"

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	// Create request
	req, err := http.NewRequest("POST", endpoint, bytes.NewReader(payloadBytes))
	if err != nil {
		return nil, err
	}

	// Set headers
	t := time.Now().UTC()
	amzDate := t.Format("20060102T150405Z")
	dateStamp := t.Format("20060102")

	req.Header.Set("Content-Type", "application/json; charset=UTF-8")
	req.Header.Set("Content-Encoding", "amz-1.0")
	req.Header.Set("Host", host)
	req.Header.Set("X-Amz-Date", amzDate)
	req.Header.Set("X-Amz-Target", "com.amazon.paapi5.v1.ProductAdvertisingAPIv1."+operation)

	// Sign request (AWS Signature Version 4)
	signedHeaders := c.signRequest(req, payloadBytes, service, c.Region, dateStamp, amzDate)
	req.Header.Set("Authorization", signedHeaders)

	// Make request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("PA-API returned %d: %s", resp.StatusCode, string(body))
	}

	return body, nil
}

func (c *PAAPIClient) signRequest(req *http.Request, payload []byte, service, region, dateStamp, amzDate string) string {
	// Create canonical request
	canonicalURI := req.URL.Path
	canonicalQueryString := ""

	// Get sorted headers
	signedHeaders := []string{"content-encoding", "content-type", "host", "x-amz-date", "x-amz-target"}
	sort.Strings(signedHeaders)
	signedHeadersStr := strings.Join(signedHeaders, ";")

	canonicalHeaders := ""
	for _, h := range signedHeaders {
		canonicalHeaders += strings.ToLower(h) + ":" + strings.TrimSpace(req.Header.Get(h)) + "\n"
	}

	payloadHash := sha256Hash(payload)
	canonicalRequest := strings.Join([]string{
		"POST",
		canonicalURI,
		canonicalQueryString,
		canonicalHeaders,
		signedHeadersStr,
		payloadHash,
	}, "\n")

	// Create string to sign
	algorithm := "AWS4-HMAC-SHA256"
	credentialScope := fmt.Sprintf("%s/%s/%s/aws4_request", dateStamp, region, service)
	stringToSign := strings.Join([]string{
		algorithm,
		amzDate,
		credentialScope,
		sha256Hash([]byte(canonicalRequest)),
	}, "\n")

	// Create signature
	signingKey := getSignatureKey(c.SecretKey, dateStamp, region, service)
	signature := hmacSHA256Hex(signingKey, stringToSign)

	// Create authorization header
	authorizationHeader := fmt.Sprintf("%s Credential=%s/%s, SignedHeaders=%s, Signature=%s",
		algorithm, c.AccessKey, credentialScope, signedHeadersStr, signature)

	return authorizationHeader
}

func sha256Hash(data []byte) string {
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

func hmacSHA256(key []byte, data string) []byte {
	mac := hmac.New(sha256.New, key)
	mac.Write([]byte(data))
	return mac.Sum(nil)
}

func hmacSHA256Hex(key []byte, data string) string {
	return hex.EncodeToString(hmacSHA256(key, data))
}

func getSignatureKey(secretKey, dateStamp, region, service string) []byte {
	kDate := hmacSHA256([]byte("AWS4"+secretKey), dateStamp)
	kRegion := hmacSHA256(kDate, region)
	kService := hmacSHA256(kRegion, service)
	kSigning := hmacSHA256(kService, "aws4_request")
	return kSigning
}

func getHost(region string) string {
	hosts := map[string]string{
		"us-east-1":      "webservices.amazon.com",
		"eu-west-1":      "webservices.amazon.co.uk",
		"us-west-2":      "webservices.amazon.com",
		"ap-southeast-1": "webservices.amazon.sg",
		"ap-northeast-1": "webservices.amazon.co.jp",
	}
	if host, ok := hosts[region]; ok {
		return host
	}
	return "webservices.amazon.com"
}

func mapCategoryToSearchIndex(category string) string {
	mapping := map[string]string{
		"electronics":      "Electronics",
		"office":           "OfficeProducts",
		"office supplies":  "OfficeProducts",
		"furniture":        "Furniture",
		"computers":        "Computers",
		"industrial":       "Industrial",
	}
	cat := strings.ToLower(category)
	if idx, ok := mapping[cat]; ok {
		return idx
	}
	return "All"
}

func mapSortBy(sortBy string) string {
	mapping := map[string]string{
		"price-asc":  "Price:LowToHigh",
		"price-desc": "Price:HighToLow",
		"rating":     "AvgCustomerReviews",
		"newest":     "NewestArrivals",
		"relevance":  "Relevance",
	}
	if s, ok := mapping[sortBy]; ok {
		return s
	}
	return "Relevance"
}

func convertPAAPIItem(item PAAPIItem) AmazonProduct {
	product := AmazonProduct{
		ASIN:       item.ASIN,
		Title:      item.ItemInfo.Title.DisplayValue,
		ProductURL: item.DetailPageURL,
		Currency:   "USD",
		Supplier:   "Amazon",
	}

	// Set image
	if item.Images.Primary.Large.URL != "" {
		product.ImageURL = item.Images.Primary.Large.URL
	} else if item.Images.Primary.Medium.URL != "" {
		product.ImageURL = item.Images.Primary.Medium.URL
	}

	// Set price and availability
	if len(item.Offers.Listings) > 0 {
		listing := item.Offers.Listings[0]
		product.Price = listing.Price.Amount
		product.Currency = listing.Price.Currency
		product.IsPrime = listing.DeliveryInfo.IsPrimeEligible
		product.Availability = listing.Availability.Message
	}

	// Set reviews
	if item.CustomerReviews.StarRating.Value > 0 {
		product.Rating = item.CustomerReviews.StarRating.Value
	}
	product.ReviewCount = item.CustomerReviews.Count

	// Set category
	if len(item.BrowseNodeInfo.BrowseNodes) > 0 {
		product.Category = item.BrowseNodeInfo.BrowseNodes[0].DisplayName
	}

	// Set brand/manufacturer as supplier
	if item.ItemInfo.ByLineInfo.Brand.DisplayValue != "" {
		product.Supplier = item.ItemInfo.ByLineInfo.Brand.DisplayValue
	} else if item.ItemInfo.ByLineInfo.Manufacturer.DisplayValue != "" {
		product.Supplier = item.ItemInfo.ByLineInfo.Manufacturer.DisplayValue
	}

	// Set specification from features
	if len(item.ItemInfo.Features.DisplayValues) > 0 {
		product.Specification = strings.Join(item.ItemInfo.Features.DisplayValues[:min(3, len(item.ItemInfo.Features.DisplayValues))], "; ")
	}

	return product
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
