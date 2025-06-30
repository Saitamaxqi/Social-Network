package middlewares

import (
    "context"
    "social/backend/pkg/models"
    "net/http"
)

func Auth(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Try to get session from cookie first
        sessionUUID, err := r.Cookie("session")
        var sessionValue string
        
        if err == nil {
            // Cookie found
            sessionValue = sessionUUID.Value
        } else {
            // Try Authorization header as fallback
            authHeader := r.Header.Get("Authorization")
            if authHeader != "" && len(authHeader) > 7 && authHeader[:7] == "Bearer " {
                sessionValue = authHeader[7:] // Remove 'Bearer ' prefix
            } else {
                http.Error(w, "Unauthorized: No valid session cookie or Authorization header", http.StatusUnauthorized)
                return
            }
        }

        // Validate the session
        session, err := models.GetSessionByUUID(sessionValue)
        if err != nil {
            http.Error(w, "Unauthorized: Invalid session", http.StatusUnauthorized)
            return
        }

        if !session.Exists() {
            http.Error(w, "Unauthorized: Session does not exist", http.StatusUnauthorized)
            return
        }

        // Get user from session and add to context
        user := &models.User{ID: session.UserID}
        err = user.Refresh()
        if err != nil {
            http.Error(w, "Unauthorized: User not found", http.StatusUnauthorized)
            return
        }

        // Create a new context with the user
        ctx := context.WithValue(r.Context(), "user", user)
        
        // Call the next handler with the new context
        next.ServeHTTP(w, r.WithContext(ctx))
    }
}

func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return MiddlewareChain(
        DefaultAPIMiddleware,
        Auth,
    )(next)
}
