package middlewares

import (
	"net/http"
)

func WebMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if len(r.RequestURI) > 4 && r.RequestURI[:4] != "/app" {
			http.Redirect(w, r, "/", http.StatusFound)
			return
		}
		next.ServeHTTP(w, r)
	}
}
