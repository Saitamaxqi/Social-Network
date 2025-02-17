package requests

import "net/http"

func RegisterRequest(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rules := Rules{
			"username": {"min:3", "max:20", "unique:users,username"},
			"email":    {"required", "email", "unique:users,email"},
			"password": {"required", "min:8", "password"},
			"age":      {"required", "greater:17", "less:101"},
			"gender":   {"required", "in:male,female"},
			"first_name": {"required", "min:2", "max:20"},
			"last_name":  {"required", "min:2", "max:20"},
			"about_me":   {"max:255"},
			"profile_type": {"required", "in:public,private"},

		}
		if err := rules.Validate(r); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		next.ServeHTTP(w, r)
	}
}
