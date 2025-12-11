package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// Logger returns a logging middleware
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(startTime)
		statusCode := c.Writer.Status()
		clientIP := c.ClientIP()
		method := c.Request.Method

		if query != "" {
			path = path + "?" + query
		}

		log.Printf("[%d] %s %s %s %v",
			statusCode,
			method,
			path,
			clientIP,
			latency,
		)
	}
}

// Recovery returns a recovery middleware that recovers from panics
func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("Panic recovered: %v", err)
				c.AbortWithStatus(500)
			}
		}()
		c.Next()
	}
}
