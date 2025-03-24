package middlewares

import (
	"net/http"
)

type Middleware func(next http.HandlerFunc) http.HandlerFunc

// DefaultAPIMiddleware is the default middleware chain for all routes
func DefaultAPIMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return MiddlewareChain(
		CORSMiddleware,
		ParseMiddleware,
		APIMiddleware,
		LoggingMiddleware,
		RateLimitingMiddleware,
	)(next)
}

// DefaultWebMiddleware is the default middleware chain for all web routes
func DefaultWebMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return MiddlewareChain(
		LoggingMiddleware,
		CORSMiddleware,
		WebMiddleware,
	)(next)
}

// MiddlewareChain chains multiple middlewares
func MiddlewareChain(middlewares ...Middleware) Middleware {
	return func(next http.HandlerFunc) http.HandlerFunc {
		for i := len(middlewares) - 1; i >= 0; i-- {
			next = middlewares[i](next)
		}
		return next.ServeHTTP
	}
}
