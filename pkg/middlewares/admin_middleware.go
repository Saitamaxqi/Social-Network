package middlewares

import (
	"forum/pkg/consts"
	"forum/pkg/models"
	"net/http"
)

// Admin checks if the user is an admin
func Admin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sessionUUID, err := r.Cookie("session")
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		session, err := models.GetSessionByUUID(sessionUUID.Value)
		if err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		sessionType, err := session.Type()
		if err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		if sessionType != consts.ADMIN {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	}
}

// AdminMiddleware is a middleware that checks if the user is an admin
func AdminMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return MiddlewareChain(
		DefaultAPIMiddleware,
		Auth,
		Admin,
	)(next)
}
