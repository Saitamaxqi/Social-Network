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

		expired := session.Expired()
		idle := session.Idle()

		if !session.Exists() || expired || idle {
			// Delete the session and cookie
			session.Delete()

			http.SetCookie(w, &http.Cookie{
				Name:   "session",
				Value:  "",
				MaxAge: -1,
			})
			if expired {
				http.Error(w, "Session expired", http.StatusUnauthorized)
				return
			}
			if idle {
				http.Error(w, "Session Timeout", http.StatusUnauthorized)
				return
			}

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
