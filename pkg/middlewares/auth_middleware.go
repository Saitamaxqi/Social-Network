package middlewares

import (
	"forum/pkg/models"
	"net/http"
)

func Auth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sessionUUID, err := r.Cookie("session")
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		session, err := models.GetSessionByUUID(sessionUUID.Value)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		if !session.Exists() {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	}
}

func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return MiddlewareChain(
		DefaultAPIMiddleware,
		Auth,
	)(next)
}
