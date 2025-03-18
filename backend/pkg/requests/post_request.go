package requests

import (
	"net/http"
)

func PostRequest(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var rules Rules
		if r.FormValue("comment") != "" {
			rules = Rules{
				"body": {"required", "min:3"},
			}
		} else {
			rules = Rules{
				"title":      {"required", "min:3"},
				"body":       {"required", "min:3"},
				"categories": {"required", "array:1,10"},
				"media":      {"file:20,M;PNG,JPG,GIF,png,jpg,gif"},
			}
		}
		if err := rules.Validate(r); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		next.ServeHTTP(w, r)
	}
}
