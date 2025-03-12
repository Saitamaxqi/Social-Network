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
			defer rows.Close()
			exists = rows.Next()
			
			if exists {
				filteredPosts = append(filteredPosts, p)
			}
			continue
		}
		
		// Close friends posts are only visible to selected users
		if postObj.Visibility == "close_friends" {
			// Check if user is in the author's close friends list
			closeFriend := &models.CloseFriend{}
			isCloseFriend, err := closeFriend.IsCloseFriend(postObj.UserID, user.ID)
			if err != nil {
				continue // Skip on error
			}
			
			if isCloseFriend {
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
	if visibility != "public" && visibility != "private" && visibility != "close_friends" {
		http.Error(w, "Invalid visibility setting. Must be 'public', 'private', or 'close_friends'", http.StatusBadRequest)
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
	
	// Check visibility permissions
	if post.Visibility != "public" {
		if err != nil {
			// User is not authenticated and post is not public
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		
		// User can always see their own posts
		if post.UserID != user.ID {
			// For private posts, check if user follows the post author
			if post.Visibility == "private" {
				var isFollowing bool
				rows, err := models.DB.Query("SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1", 
					user.ID, post.UserID)
				if err != nil {
					http.Error(w, "Error checking follow status", http.StatusInternalServerError)
					return
				}
				defer rows.Close()
				isFollowing = rows.Next()
				
				if !isFollowing {
					http.Error(w, "Unauthorized", http.StatusUnauthorized)
					return
				}
			}
			
			// For close friends posts, check if user is in the author's close friends list
			if post.Visibility == "close_friends" {
				var isCloseFriend bool
				rows, err := models.DB.Query("SELECT 1 FROM close_friends WHERE user_id = ? AND friend_id = ? LIMIT 1", 
					post.UserID, user.ID)
				if err != nil {
					http.Error(w, "Error checking close friend status", http.StatusInternalServerError)
					return
				}
				defer rows.Close()
				isCloseFriend = rows.Next()
				
				if !isCloseFriend {
					http.Error(w, "Unauthorized", http.StatusUnauthorized)
					return
				}
			}
		}
	}
	
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
