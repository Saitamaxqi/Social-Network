package controllers

import (
	"database/sql"
	"fmt"
	"forum/pkg/consts"
	"forum/pkg/models"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func PostController(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		if r.PathValue("id") != "" {
			ShowPost(w, r)
		} else {
			IndexPosts(w, r)
		}
	case "POST":
		CreatePost(w, r)
	case "PUT":
		UpdatePost(w, r)
	case "DELETE":
		DeletePost(w, r)
	}
}

func IndexPosts(w http.ResponseWriter, r *http.Request) {
	post := &models.Post{}
	posts, err := post.Index()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, posts)
}

func CreatePost(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	post := &models.Post{
		UserID: user.ID,
		Title:  r.FormValue("title"),
		Body:   r.FormValue("body"),
	}
	err = post.Create()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Store media file if exists
	mediaFile, header, err := r.FormFile("media")
	if err == nil && mediaFile != nil {
		err = post.StoreMediaFile(mediaFile, header)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			post.Delete()
			return
		}
	}

	var categoryIDs []int
	for _, categoryID := range strings.Split(r.FormValue("categories"), ",") {
		id, err := strconv.Atoi(categoryID)
		if err != nil && categoryID != "" {
			http.Error(w, "Invalid category ID", http.StatusBadRequest)
			return
		}
		categoryIDs = append(categoryIDs, id)
	}

	err = post.SyncCategories(categoryIDs)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = post.GetRelations()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusCreated, post)
}

func UpdatePost(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}
	post := &models.Post{
		ID: id,
	}
	err = post.Refresh()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	if post.UserID != user.ID {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	post.Title = r.FormValue("title")
	post.Body = r.FormValue("body")
	err = post.Update()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Store media file if exists
	mediaFile, header, err := r.FormFile("media")
	if err == nil && mediaFile != nil {
		err = post.StoreMediaFile(mediaFile, header)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	var categoryIDs []int
	for _, categoryID := range strings.Split(r.FormValue("categories"), ",") {
		id, err := strconv.Atoi(categoryID)
		if err != nil && categoryID != "" {
			http.Error(w, "Invalid category ID", http.StatusBadRequest)
			return
		}
		categoryIDs = append(categoryIDs, id)
	}

	err = post.SyncCategories(categoryIDs)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = post.GetRelations()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, post)
}

func DeletePost(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}
	post := &models.Post{
		ID: id,
	}
	err = post.Refresh()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	if !user.AllowedToDeletePost(post) {
		http.Error(w, "User not allowed to delete post", http.StatusUnauthorized)
		return
	}

	err = post.Delete()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, post)
}

func ShowPost(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}
	post := &models.Post{
		ID: id,
	}
	err = post.Refresh()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = post.GetRelations()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	user, err := AuthUser(r)
	if err == nil {
		post.GetInteraction(user.ID)
	}

	RespondWithJSON(w, http.StatusOK, post)
}

func DeletePostMedia(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}
	post := &models.Post{
		ID: id,
	}
	err = post.Refresh()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	if post.UserID != user.ID {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	err = post.DeleteMediaFile()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, post)
}

func InteractPost(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	postID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}
	_, err = models.GetByID("post", postID)
	if err != nil {
		http.Error(w, "Default_component not found", http.StatusNotFound)
		return
	}

	interaction := consts.NONE
	switch r.FormValue("type") {
	case "like":
		interaction, err = user.LikePost(postID)
	case "dislike":
		interaction, err = user.DislikePost(postID)
	default:
		http.Error(w, "Invalid interaction type", http.StatusBadRequest)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	text := ""
	switch interaction {
	case consts.LIKE:
		text = "liked"
	case consts.DISLIKE:
		text = "disliked"
	case consts.NONE:
		text = "removed interaction from"
	}

	post := &models.Post{ID: postID}
	err = post.Refresh()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	notification := &models.Notification{
		UserID:   post.UserID,
		Text:     fmt.Sprintf("%s %s your post", user.Username, text),
		SenderID: user.ID,
		Type:     consts.POST,
		LinkID:   postID,
		Date:     time.Now(),
	}
	
	hub.SendToUser(post.UserID, map[string]interface{}{
		"type": "notification",
		"notification": notification,
	})

	err = notification.Create()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, map[string]interface{}{"interaction": interaction})
}

func CommentPost(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	postID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	comment := &models.Post{
		UserID: user.ID,
		PostID: sql.NullInt64{Int64: int64(postID), Valid: true},
		Title:  "Comment",
		Body:   r.FormValue("body"),
	}

	err = comment.Create()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = comment.GetRelations()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	post := &models.Post{ID: postID}
	err = post.Refresh()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	notification := &models.Notification{
		UserID:   post.UserID,
		Text:     fmt.Sprintf("%s commented on your post", user.Username),
		SenderID: user.ID,
		Type:     consts.COMMENT,
		LinkID:   comment.ID,
		Date:     time.Now(),
	}
	hub.SendToUser(post.UserID, map[string]interface{}{
		"type": "notification",
		"notification": notification,
	})

	err = notification.Create()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, comment)
}
