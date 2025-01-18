package controllers

import (
	"net/http"
)

func ActivityController(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		IndexActivity(w, r)
	}
}

func IndexActivity(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	result := make(map[string]interface{})

	posts, err := user.Posts()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	result["posts"] = posts

	posts, err = user.LikedPosts()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	result["liked_posts"] = posts

	posts, err = user.DislikedPosts()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	result["disliked_posts"] = posts

	posts, err = user.Comments()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	result["comments"] = posts

	RespondWithJSON(w, http.StatusOK, result)
}
