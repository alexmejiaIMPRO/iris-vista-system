package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"vista-backend/config"
	"vista-backend/internal/handlers"
	"vista-backend/internal/middleware"
	"vista-backend/internal/services"
	"vista-backend/internal/services/amazon"
	"vista-backend/migrations"
	"vista-backend/pkg/crypto"
	"vista-backend/pkg/jwt"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := config.InitDatabase(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Run migrations
	if err := migrations.RunMigrations(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Seed initial data
	if err := migrations.SeedData(db); err != nil {
		log.Fatalf("Failed to seed data: %v", err)
	}

	// Initialize services
	jwtService := jwt.NewJWTService(cfg.JWT.SecretKey, cfg.JWT.AccessTokenExpiry, cfg.JWT.RefreshTokenExpiry)
	encryptionService, err := crypto.NewEncryptionService(cfg.Crypto.EncryptionKey)
	if err != nil {
		log.Fatalf("Failed to initialize encryption service: %v", err)
	}

	authService := services.NewAuthService(db, jwtService)
	amazonService := amazon.NewAutomationService()

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(db)
	productHandler := handlers.NewProductHandler(db)
	requestHandler := handlers.NewRequestHandler(db)
	approvalHandler := handlers.NewApprovalHandler(db, amazonService, encryptionService)
	adminHandler := handlers.NewAdminHandler(db, encryptionService, amazonService)
	uploadHandler := handlers.NewUploadHandler()

	// Setup router
	router := gin.Default()

	// CORS middleware
	corsConfig := middleware.DefaultCORSConfig()
	corsConfig.AllowOrigins = cfg.Server.AllowOrigins
	router.Use(middleware.CORS(corsConfig))

	// Logger and recovery
	router.Use(middleware.Logger())
	router.Use(middleware.Recovery())

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Auth routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
		}

		// Auth routes (protected)
		authProtected := v1.Group("/auth")
		authProtected.Use(middleware.Auth(jwtService))
		{
			authProtected.POST("/logout", authHandler.Logout)
			authProtected.GET("/me", authHandler.Me)
		}

		// User routes (admin only)
		users := v1.Group("/users")
		users.Use(middleware.Auth(jwtService))
		users.Use(middleware.RequireAdmin())
		{
			users.GET("", userHandler.ListUsers)
			users.GET("/:id", userHandler.GetUser)
			users.POST("", userHandler.CreateUser)
			users.PUT("/:id", userHandler.UpdateUser)
			users.DELETE("/:id", userHandler.DeleteUser)
			users.PATCH("/:id/toggle", userHandler.ToggleUserStatus)
		}

		// User self-service routes
		profile := v1.Group("/profile")
		profile.Use(middleware.Auth(jwtService))
		{
			profile.PUT("/password", userHandler.ChangePassword)
		}

		// Product routes (all authenticated users)
		products := v1.Group("/products")
		products.Use(middleware.Auth(jwtService))
		{
			products.GET("", productHandler.ListProducts)
			products.GET("/categories", productHandler.GetCategories)
			products.GET("/:id", productHandler.GetProduct)
		}

		// Product management routes (admin/supply chain)
		productsMgmt := v1.Group("/products")
		productsMgmt.Use(middleware.Auth(jwtService))
		productsMgmt.Use(middleware.RequireAdminOrSupplyChain())
		{
			productsMgmt.POST("", productHandler.CreateProduct)
			productsMgmt.PUT("/:id", productHandler.UpdateProduct)
			productsMgmt.DELETE("/:id", productHandler.DeleteProduct)
			productsMgmt.PATCH("/:id/stock", productHandler.UpdateStock)
		}

		// Purchase request routes (all authenticated users)
		requests := v1.Group("/purchase-requests")
		requests.Use(middleware.Auth(jwtService))
		{
			requests.POST("/extract-metadata", requestHandler.ExtractMetadata)
			requests.POST("", requestHandler.CreateRequest)
			requests.GET("/my", requestHandler.GetMyRequests)
			requests.GET("/:id", requestHandler.GetRequest)
			requests.PUT("/:id", requestHandler.UpdateRequest)
			requests.DELETE("/:id", requestHandler.CancelRequest)
		}

		// All requests route (for admin/gm/scm)
		allRequests := v1.Group("/requests")
		allRequests.Use(middleware.Auth(jwtService))
		allRequests.Use(middleware.CanViewAllRequests())
		{
			allRequests.GET("", requestHandler.ListRequests)
		}

		// Approval routes (general manager)
		approvals := v1.Group("/approvals")
		approvals.Use(middleware.Auth(jwtService))
		approvals.Use(middleware.RequireApprover())
		{
			approvals.GET("", approvalHandler.ListPendingApprovals)
			approvals.GET("/stats", approvalHandler.GetApprovalStats)
			approvals.GET("/:id", approvalHandler.GetApprovalDetails)
			approvals.POST("/:id/approve", approvalHandler.ApproveRequest)
			approvals.POST("/:id/reject", approvalHandler.RejectRequest)
			approvals.POST("/:id/request-info", approvalHandler.RequestInfo)
		}

		// Admin routes
		admin := v1.Group("/admin")
		admin.Use(middleware.Auth(jwtService))
		admin.Use(middleware.RequireAdmin())
		{
			admin.GET("/dashboard", adminHandler.GetDashboardStats)

			// Amazon config
			admin.GET("/amazon/config", adminHandler.GetAmazonConfig)
			admin.PUT("/amazon/config", adminHandler.SaveAmazonConfig)
			admin.POST("/amazon/test", adminHandler.TestAmazonConnection)
			admin.GET("/amazon/session", adminHandler.GetAmazonSessionStatus)

			// Approved orders management
			admin.GET("/approved-orders", adminHandler.GetApprovedOrders)
			admin.PATCH("/orders/:id/purchased", adminHandler.MarkAsPurchased)
			admin.POST("/orders/:id/retry-cart", adminHandler.RetryAddToCart)
		}

		// Upload routes (admin/supply chain)
		upload := v1.Group("/upload")
		upload.Use(middleware.Auth(jwtService))
		upload.Use(middleware.RequireAdminOrSupplyChain())
		{
			upload.GET("/requirements", uploadHandler.GetUploadRequirements)
			upload.POST("/image", uploadHandler.UploadImage)
			upload.POST("/images", uploadHandler.UploadImages)
			upload.DELETE("/image", uploadHandler.DeleteImage)
		}
	}

	// Serve uploaded files (with cache headers)
	router.Static("/uploads", "./uploads")

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Start server
	log.Printf("Server starting on port %s...", cfg.Server.Port)
	log.Printf("Environment: %s", cfg.Server.Environment)
	log.Printf("CORS Origins: %v", cfg.Server.AllowOrigins)

	if err := router.Run(":" + cfg.Server.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
