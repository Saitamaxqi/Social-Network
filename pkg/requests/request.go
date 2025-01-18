package requests

import (
	"net/http"
)

type Request func(http.HandlerFunc) http.HandlerFunc

// DefaultRequest is a middleware function without any validation
func DefaultRequest(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r)
	}
}
