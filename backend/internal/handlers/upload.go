package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"vista-backend/pkg/response"
)

// Upload configuration constants
const (
	MaxFileSize     = 5 * 1024 * 1024 // 5MB max file size
	UploadDir       = "./uploads"
	MaxFilesPerReq  = 10
)

// Allowed image MIME types and extensions
var allowedMimeTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/gif":  true,
	"image/webp": true,
}

var allowedExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
	".webp": true,
}

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	// Ensure upload directory exists
	if err := os.MkdirAll(UploadDir, 0755); err != nil {
		panic("Failed to create upload directory: " + err.Error())
	}
	return &UploadHandler{}
}

type UploadResponse struct {
	URL      string `json:"url"`
	Filename string `json:"filename"`
	Size     int64  `json:"size"`
	MimeType string `json:"mime_type"`
}

type UploadRequirements struct {
	MaxFileSize       string   `json:"max_file_size"`
	AllowedTypes      []string `json:"allowed_types"`
	AllowedExtensions []string `json:"allowed_extensions"`
	MaxFilesPerUpload int      `json:"max_files_per_upload"`
}

// GetUploadRequirements returns the upload requirements for the frontend
func (h *UploadHandler) GetUploadRequirements(c *gin.Context) {
	requirements := UploadRequirements{
		MaxFileSize:       "5MB",
		AllowedTypes:      []string{"image/jpeg", "image/png", "image/gif", "image/webp"},
		AllowedExtensions: []string{".jpg", ".jpeg", ".png", ".gif", ".webp"},
		MaxFilesPerUpload: MaxFilesPerReq,
	}
	response.Success(c, requirements)
}

// UploadImage handles single image upload with security validation
func (h *UploadHandler) UploadImage(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.BadRequest(c, "No file provided")
		return
	}
	defer file.Close()

	// Validate file size
	if header.Size > MaxFileSize {
		response.BadRequest(c, fmt.Sprintf("File size exceeds maximum allowed (%d MB)", MaxFileSize/(1024*1024)))
		return
	}

	// Validate file extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedExtensions[ext] {
		response.BadRequest(c, fmt.Sprintf("File extension '%s' not allowed. Allowed: %v", ext, getExtensionList()))
		return
	}

	// Read first 512 bytes to detect MIME type
	buffer := make([]byte, 512)
	_, err = file.Read(buffer)
	if err != nil {
		response.InternalServerError(c, "Failed to read file")
		return
	}
	// Reset file reader position
	file.Seek(0, io.SeekStart)

	// Detect actual MIME type from file content (not just the header)
	mimeType := http.DetectContentType(buffer)
	if !allowedMimeTypes[mimeType] {
		response.BadRequest(c, fmt.Sprintf("File type '%s' not allowed. Allowed: JPEG, PNG, GIF, WebP", mimeType))
		return
	}

	// Generate unique filename to prevent collisions and path traversal
	uniqueID := uuid.New().String()
	safeFilename := fmt.Sprintf("%s_%d%s", uniqueID, time.Now().Unix(), ext)

	// Create date-based subdirectory for organization
	dateDir := time.Now().Format("2006/01")
	uploadPath := filepath.Join(UploadDir, dateDir)
	if err := os.MkdirAll(uploadPath, 0755); err != nil {
		response.InternalServerError(c, "Failed to create upload directory")
		return
	}

	fullPath := filepath.Join(uploadPath, safeFilename)

	// Create destination file
	dst, err := os.Create(fullPath)
	if err != nil {
		response.InternalServerError(c, "Failed to save file")
		return
	}
	defer dst.Close()

	// Copy file contents
	written, err := io.Copy(dst, file)
	if err != nil {
		os.Remove(fullPath) // Clean up on error
		response.InternalServerError(c, "Failed to save file")
		return
	}

	// Generate URL path (relative to server)
	urlPath := fmt.Sprintf("/uploads/%s/%s", dateDir, safeFilename)

	response.Created(c, UploadResponse{
		URL:      urlPath,
		Filename: safeFilename,
		Size:     written,
		MimeType: mimeType,
	})
}

// UploadImages handles multiple image uploads
func (h *UploadHandler) UploadImages(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		response.BadRequest(c, "Invalid multipart form")
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		response.BadRequest(c, "No files provided")
		return
	}

	if len(files) > MaxFilesPerReq {
		response.BadRequest(c, fmt.Sprintf("Maximum %d files allowed per upload", MaxFilesPerReq))
		return
	}

	var results []UploadResponse
	var errors []string

	for i, fileHeader := range files {
		// Validate file size
		if fileHeader.Size > MaxFileSize {
			errors = append(errors, fmt.Sprintf("File %d: exceeds max size of %dMB", i+1, MaxFileSize/(1024*1024)))
			continue
		}

		// Validate extension
		ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
		if !allowedExtensions[ext] {
			errors = append(errors, fmt.Sprintf("File %d: extension '%s' not allowed", i+1, ext))
			continue
		}

		file, err := fileHeader.Open()
		if err != nil {
			errors = append(errors, fmt.Sprintf("File %d: failed to open", i+1))
			continue
		}

		// Read first 512 bytes for MIME detection
		buffer := make([]byte, 512)
		file.Read(buffer)
		file.Seek(0, io.SeekStart)

		mimeType := http.DetectContentType(buffer)
		if !allowedMimeTypes[mimeType] {
			file.Close()
			errors = append(errors, fmt.Sprintf("File %d: type '%s' not allowed", i+1, mimeType))
			continue
		}

		// Generate unique filename
		uniqueID := uuid.New().String()
		safeFilename := fmt.Sprintf("%s_%d%s", uniqueID, time.Now().UnixNano(), ext)

		dateDir := time.Now().Format("2006/01")
		uploadPath := filepath.Join(UploadDir, dateDir)
		os.MkdirAll(uploadPath, 0755)

		fullPath := filepath.Join(uploadPath, safeFilename)

		dst, err := os.Create(fullPath)
		if err != nil {
			file.Close()
			errors = append(errors, fmt.Sprintf("File %d: failed to save", i+1))
			continue
		}

		written, err := io.Copy(dst, file)
		dst.Close()
		file.Close()

		if err != nil {
			os.Remove(fullPath)
			errors = append(errors, fmt.Sprintf("File %d: failed to save", i+1))
			continue
		}

		urlPath := fmt.Sprintf("/uploads/%s/%s", dateDir, safeFilename)
		results = append(results, UploadResponse{
			URL:      urlPath,
			Filename: safeFilename,
			Size:     written,
			MimeType: mimeType,
		})
	}

	if len(results) == 0 && len(errors) > 0 {
		response.BadRequest(c, strings.Join(errors, "; "))
		return
	}

	responseData := gin.H{
		"uploaded": results,
	}
	if len(errors) > 0 {
		responseData["errors"] = errors
	}

	response.Success(c, responseData)
}

// DeleteImage removes an uploaded image
func (h *UploadHandler) DeleteImage(c *gin.Context) {
	// Get the path from query parameter
	imagePath := c.Query("path")
	if imagePath == "" {
		response.BadRequest(c, "Image path required")
		return
	}

	// Security: Ensure path is within uploads directory and sanitize
	cleanPath := filepath.Clean(imagePath)
	if !strings.HasPrefix(cleanPath, "/uploads/") {
		response.BadRequest(c, "Invalid image path")
		return
	}

	// Convert URL path to file path
	filePath := "." + cleanPath

	// Verify file exists and is within upload directory
	absPath, err := filepath.Abs(filePath)
	if err != nil {
		response.BadRequest(c, "Invalid image path")
		return
	}

	absUploadDir, _ := filepath.Abs(UploadDir)
	if !strings.HasPrefix(absPath, absUploadDir) {
		response.BadRequest(c, "Invalid image path")
		return
	}

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		response.NotFound(c, "Image not found")
		return
	}

	// Delete the file
	if err := os.Remove(filePath); err != nil {
		response.InternalServerError(c, "Failed to delete image")
		return
	}

	response.SuccessWithMessage(c, "Image deleted successfully", nil)
}

func getExtensionList() []string {
	list := make([]string, 0, len(allowedExtensions))
	for ext := range allowedExtensions {
		list = append(list, ext)
	}
	return list
}
