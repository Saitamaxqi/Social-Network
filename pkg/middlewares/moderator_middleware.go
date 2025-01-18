package middlewares

import (
	"forum/pkg/consts"
	"forum/pkg/models"
	"net/http"
)

// Moderator checks if the user is a moderator
func Moderator(next http.HandlerFunc) http.HandlerFunc {
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

		if sessionType != consts.MODERATOR && sessionType != consts.ADMIN {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	}
}

func ModeratorMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return MiddlewareChain(
		DefaultAPIMiddleware,
		Auth,
		Moderator,
	)(next)
}
