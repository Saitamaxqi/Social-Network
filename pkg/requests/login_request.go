package requests

import (
	"net/http"
)

func LoginRequest(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        rules := Rules{
            "identifier": {"required"},
            "password":   {"required"},
        }
        if err := rules.Validate(r); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }

        next.ServeHTTP(w, r)
    }
}

