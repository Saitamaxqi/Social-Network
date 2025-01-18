package middlewares

import (
	"forum/pkg/controllers"
	"net/http"
)

func APIMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if len(r.RequestURI) > 4 && r.RequestURI[:4] != "/api" {
			controllers.HomeController(w, r)
			return
		}
		next.ServeHTTP(w, r)
	}
}
