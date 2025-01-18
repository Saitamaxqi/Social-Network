package middlewares

import (
	"net/http"
)

func ParseMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" || r.Method == "PUT" {
			r.ParseMultipartForm(10 << 20) // 10 MB
		}

		next.ServeHTTP(w, r)
	}
}
