package middlewares

import (
	"forum/pkg/consts"
	"forum/pkg/env"
	"forum/pkg/responses"
	"log"
	"net/http"
)

// LoggingMiddleware logs the request method and path
func LoggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		t := "WEB"
		if len(r.RequestURI) > 4 && r.RequestURI[:4] == "/api" {
			t = "API"
		}
		rw := responses.NewResponseWriter(w)

		log.Printf("Request from %s, method: %s, path: %s, query: %v\n", t, r.Method, r.URL.Path, r.URL.Query())

		next.ServeHTTP(rw, r)

		color := colorByStatus(rw.Status())
		log.Printf("%sResponse from %s, status: %d%s", color, t, rw.Status(), consts.WHITE)
		if env.Get("ENV") == "development" {
			log.Printf("Response body: %s\n", rw.Body())
		}
	}
}

func colorByStatus(status int) string {
	if status >= 200 && status < 300 {
		return consts.GREEN
	} else if status >= 300 && status < 400 {
		return consts.BLUE
	} else if status >= 400 && status < 500 {
		return consts.RED
	} else if status >= 500 {
		return consts.YELLOW
	} else {
		return consts.WHITE
	}
}
