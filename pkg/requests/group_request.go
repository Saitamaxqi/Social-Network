package requests

import (
	"net/http"
)

// GroupRequest validates group creation/update requests
func GroupRequest(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost && r.Method != http.MethodPut {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		title := r.FormValue("title")
		description := r.FormValue("description")

		if title == "" {
			http.Error(w, "Title is required", http.StatusBadRequest)
			return
		}

		if len(title) > 100 {
			http.Error(w, "Title is too long (max 100 characters)", http.StatusBadRequest)
			return
		}

		if len(description) > 500 {
			http.Error(w, "Description is too long (max 500 characters)", http.StatusBadRequest)
			return
		}

		next.ServeHTTP(w, r)
	}
}

// GroupPostRequest validates group post creation/update requests
func GroupPostRequest(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost && r.Method != http.MethodPut {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		content := r.FormValue("content")
		if content == "" {
			http.Error(w, "Content is required", http.StatusBadRequest)
			return
		}

		if len(content) > 1000 {
			http.Error(w, "Content is too long (max 1000 characters)", http.StatusBadRequest)
			return
		}

		next.ServeHTTP(w, r)
	}
}

// GroupEventRequest validates group event creation/update requests
func GroupEventRequest(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost && r.Method != http.MethodPut {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		title := r.FormValue("title")
		description := r.FormValue("description")
		date := r.FormValue("date")
		location := r.FormValue("location")

		if title == "" {
			http.Error(w, "Title is required", http.StatusBadRequest)
			return
		}

		if len(title) > 100 {
			http.Error(w, "Title is too long (max 100 characters)", http.StatusBadRequest)
			return
		}

		if len(description) > 500 {
			http.Error(w, "Description is too long (max 500 characters)", http.StatusBadRequest)
			return
		}

		if date == "" {
			http.Error(w, "Date is required", http.StatusBadRequest)
			return
		}

		if len(location) > 200 {
			http.Error(w, "Location is too long (max 200 characters)", http.StatusBadRequest)
			return
		}

		next.ServeHTTP(w, r)
	}
}

// GroupEventResponseRequest validates event response requests
func GroupEventResponseRequest(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		response := r.FormValue("response")
		if response != "going" && response != "not_going" {
			http.Error(w, "Invalid response (must be 'going' or 'not_going')", http.StatusBadRequest)
			return
		}

		next.ServeHTTP(w, r)
	}
}

// GroupMemberRequest validates group member invite requests
func GroupMemberRequest(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		userID := r.FormValue("user_id")
		if userID == "" {
			http.Error(w, "User ID is required", http.StatusBadRequest)
			return
		}

		next.ServeHTTP(w, r)
	}
}

// GroupMessageRequest validates group message requests
func GroupMessageRequest(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		content := r.FormValue("content")
		if content == "" {
			http.Error(w, "Message content is required", http.StatusBadRequest)
			return
		}

		if len(content) > 1000 {
			http.Error(w, "Message content is too long (max 1000 characters)", http.StatusBadRequest)
			return
		}

		next.ServeHTTP(w, r)
	}
}
