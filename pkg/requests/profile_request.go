package requests

import "net/http"

func ProfileRequest(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rules := Rules{
			"username":         {"required", "min:3", "max:50"},
			"email":            {"required", "email", "max:50"},
			"password":         {"min:6", "max:50"},
			"confirm_password": {"min:6", "max:50"},
		}
		if err := rules.Validate(r); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		next.ServeHTTP(w, r)
	}
}
