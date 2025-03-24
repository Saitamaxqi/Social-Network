package middlewares

import (
	"golang.org/x/time/rate"
	"net/http"
)

var RateLimiter = rate.NewLimiter(1, 30)

// RateLimitingMiddleware limits the number of requests per second
func RateLimitingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !RateLimiter.Allow() {
			http.Error(w, "Too many requests", http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	}
}
