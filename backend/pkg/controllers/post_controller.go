package controllers

import (
	"database/sql"
	"fmt"
	"social/backend/pkg/consts"
	"social/backend/pkg/models"
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
	user, _ := AuthUser(r) // Get current user, might be nil for unauthenticated users
	
	post := &models.Post{}
	posts, err := post.Index()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Filter posts based on visibility settings
	var filteredPosts []models.Model
	for _, p := range posts {
		postObj := p.(*models.Post)
		if postObj.Visibility == "group" {
			continue
		}
		// Public posts are visible to everyone
		if postObj.Visibility == "public" {
			filteredPosts = append(filteredPosts, p)
			continue
		}
		
		// If user is not authenticated, they can only see public posts
		if user == nil {
			continue
		}
		
		// User can always see their own posts
		if postObj.UserID == user.ID {
			filteredPosts = append(filteredPosts, p)
			continue
		}
		
		// Private posts are visible to followers
		if postObj.Visibility == "private" {
			// Check if the user follows the post author
			var exists bool
			rows, err := models.DB.Query("SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1", 
				user.ID, postObj.UserID)
			if err != nil {
				continue // Skip on error
			}
			// Use a function to properly close the rows
			exists = func(rows *sql.Rows) bool {
				defer rows.Close()
				return rows.Next()
			}(rows)
			
			if exists {
				filteredPosts = append(filteredPosts, p)
			}
			continue
		}
		
		// Close friends posts are only visible to selected users
		if postObj.Visibility == "close_friends" {
			// Check if user is in the author's close friends list
			isCloseFriend, err := user.IsCloseFriend(postObj.UserID)
			if err != nil {
				continue // Skip on error
			}
			
			if isCloseFriend {
				filteredPosts = append(filteredPosts, p)
			}
			continue
		}

		// Super private posts are only visible to specifically permitted users
		if postObj.Visibility == "super_private" {
			// Check if user has explicit permission to view this post
			var hasPermission bool
			rows, err := models.DB.Query("SELECT 1 FROM post_permissions WHERE post_id = ? AND user_id = ? LIMIT 1",
				postObj.ID, user.ID)
			if err != nil {
				continue // Skip on error
			}
			// Use a function to properly close the rows
			hasPermission = func(rows *sql.Rows) bool {
				defer rows.Close()
				return rows.Next()
			}(rows)
			
			if hasPermission {
				filteredPosts = append(filteredPosts, p)
			}
		}
	}

	RespondWithJSON(w, http.StatusOK, filteredPosts)
}

func CreatePost(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Get visibility setting with default to "public"
	visibility := r.FormValue("visibility")
	if visibility == "" {
		visibility = "public"
	}
	
	// Validate visibility value
	if visibility != "public" && visibility != "private" && visibility != "close_friends" && visibility != "super_private" {
		http.Error(w, "Invalid visibility setting. Must be 'public', 'private', 'close_friends', or 'super_private'", http.StatusBadRequest)
		return
	}

	post := &models.Post{
		UserID:     user.ID,
		Title:      r.FormValue("title"),
		Body:       r.FormValue("body"),
		Visibility: visibility,
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

	// Handle super_private post permissions if specified
	if visibility == "super_private" {
		// Get the allowed users from the form
		allowedUsersStr := r.FormValue("allowed_users")
		if allowedUsersStr != "" {
			allowedUserIDs := []int{}
			for _, idStr := range strings.Split(allowedUsersStr, ",") {
				id, err := strconv.Atoi(idStr)
				if err != nil {
					continue
				}
				allowedUserIDs = append(allowedUserIDs, id)
			}

			// Save permissions for each allowed user
			for _, userID := range allowedUserIDs {
				_, err = models.DB.Exec(
					"INSERT INTO post_permissions (post_id, user_id) VALUES (?, ?)",
					post.ID, userID,
				)
				if err != nil {
					// Log error but continue
					fmt.Printf("Error adding permission for user %d: %v\n", userID, err)
				}
			}
		}
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
	
	// Check if visibility is being updated
	newVisibility := r.FormValue("visibility")
	if newVisibility != "" {
		// Validate visibility value
		if newVisibility != "public" && newVisibility != "private" && newVisibility != "close_friends" && newVisibility != "super_private" {
			http.Error(w, "Invalid visibility setting. Must be 'public', 'private', 'close_friends', or 'super_private'", http.StatusBadRequest)
			return
		}
		post.Visibility = newVisibility
	}
	
	err = post.Update()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	// If visibility is super_private, update permissions
	if post.Visibility == "super_private" {
		allowedUsersStr := r.FormValue("allowed_users")
		if allowedUsersStr != "" {
			// First, remove all existing permissions
			_, err = models.DB.Exec("DELETE FROM post_permissions WHERE post_id = ?", post.ID)
			if err != nil {
				fmt.Printf("Error removing existing permissions: %v\n", err)
			}
			
			// Parse and add new permissions
			allowedUserIDs := []int{}
			for _, idStr := range strings.Split(allowedUsersStr, ",") {
				id, err := strconv.Atoi(idStr)
				if err != nil {
					continue
				}
				allowedUserIDs = append(allowedUserIDs, id)
			}

			// Save permissions for each allowed user
			for _, userID := range allowedUserIDs {
				_, err = models.DB.Exec(
					"INSERT INTO post_permissions (post_id, user_id) VALUES (?, ?)",
					post.ID, userID,
				)
				if err != nil {
					// Log error but continue
					fmt.Printf("Error adding permission for user %d: %v\n", userID, err)
				}
			}
		}
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
if post.UserID != user.ID {
	notification := &models.Notification{
		UserID:   post.UserID,
		Text:     fmt.Sprintf("%s %s your post", user.Username, text),
		SenderID: user.ID,
		Type:     consts.POST,
		LinkID:   postID,
		Date:     time.Now(),
	}



	err = notification.Create()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}	
	err = notification.Refresh()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	hub.SendToUser(post.UserID, map[string]interface{}{
		"type": "notification",
		"notification": notification,
	})
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

	// Parse multipart form to handle file uploads
	err = r.ParseMultipartForm(10 << 20) // 10 MB max memory
	if err != nil && err != http.ErrNotMultipart {
		http.Error(w, "Error parsing form data", http.StatusBadRequest)
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

	// Handle media file upload if present
	mediaFile, mediaHeader, err := r.FormFile("media")
	if err == nil && mediaFile != nil {
		defer mediaFile.Close()
		
		// Store the media file
		err = comment.StoreMediaFile(mediaFile, mediaHeader)
		if err != nil {
			// Log the error but continue, as the comment is already created
			fmt.Printf("Error storing media file: %v\n", err)
		}
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

	if post.UserID != user.ID {

	notification := &models.Notification{
		UserID:   post.UserID,
		Text:     fmt.Sprintf("%s commented on your post", user.Username),
		SenderID: user.ID,
		Type:     consts.COMMENT,
		LinkID:   comment.ID,
		Date:     time.Now(),
	}


	err = notification.Create()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}	
	
	err = notification.Refresh()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}	
	
	hub.SendToUser(post.UserID, map[string]interface{}{
		"type": "notification",
		"notification": notification,
	})
}

	RespondWithJSON(w, http.StatusOK, comment)
}
