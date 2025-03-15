package controllers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"forum/pkg/models"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// CreateGroup handles the creation of a new group
func CreateGroup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user from context (set by auth middleware)
	user, ok := r.Context().Value("user").(*models.User)
	if !ok || user == nil {
		http.Error(w, "Unauthorized: User not found in context", http.StatusUnauthorized)
		return
	}

	// Initialize group
	group := models.Group{}

	// Check content type to determine how to parse the request
	contentType := r.Header.Get("Content-Type")

	if contentType == "application/json" {
		// Parse JSON data
		decoder := json.NewDecoder(r.Body)
		if err := decoder.Decode(&group); err != nil {
			http.Error(w, "Error parsing JSON data: "+err.Error(), http.StatusBadRequest)
			return
		}
		defer r.Body.Close()
	} else {
		// Parse form values
		if err := r.ParseForm(); err != nil {
			http.Error(w, "Error parsing form data: "+err.Error(), http.StatusBadRequest)
			return
		}

		// Create group from form values
		group.Title = r.FormValue("title")
		group.Description = r.FormValue("description")
	}

	// Validate required fields
	if group.Title == "" {
		http.Error(w, "Title is required", http.StatusBadRequest)
		return
	}

	// Set the creator ID from the authenticated user
	group.CreatorID = user.ID

	// Create the group in the database
	if err := group.Create(); err != nil {
		http.Error(w, "Error creating group: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Add creator as a member automatically
	member := &models.GroupMember{
		GroupID: group.ID,
		UserID:  user.ID,
		Status:  "member",
	}
	if err := member.Create(); err != nil {
		http.Error(w, "Error creating group member: "+err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, group)
}

// GetGroup returns a specific group by ID
func GetGroup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user from context (set by auth middleware)
	user, ok := r.Context().Value("user").(*models.User)
	if !ok || user == nil {
		http.Error(w, "Unauthorized: User not found in context", http.StatusUnauthorized)
		return
	}

	// Extract group ID from URL parameters
	groupIDStr := r.PathValue("id")
	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	// Get the group from the database
	group := models.Group{ID: groupID}
	err = group.Refresh()
	if err != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// Check if the user is a member of the group
	var isMember bool
	row := models.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'member')", groupID, user.ID)
	err = row.Scan(&isMember)
	if err != nil {
		http.Error(w, "Error checking group membership", http.StatusInternalServerError)
		return
	}

	// If the user is not a member and not the creator, check if the group is public
	if !isMember && group.CreatorID != user.ID {
		// For now, all groups are accessible to all users
		// In the future, we could add a 'privacy' field to the group model
	}

	// Get group members
	rows, err := models.DB.Query("SELECT gm.id, gm.user_id, gm.status, gm.created_at, u.username, u.first_name, u.last_name, u.avatar FROM group_members gm JOIN users u ON gm.user_id = u.id WHERE gm.group_id = ?", groupID)
	if err != nil {
		http.Error(w, "Error fetching group members", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	group.Members = []*models.GroupMember{}
	for rows.Next() {
		member := &models.GroupMember{}
		user := &models.User{}
		var avatar sql.NullString
		err = rows.Scan(&member.ID, &member.UserID, &member.Status, &member.CreatedAt, &user.Username, &user.FirstName, &user.LastName, &avatar)
		if err != nil {
			http.Error(w, "Error scanning group member", http.StatusInternalServerError)
			return
		}
		user.Avatar = avatar
		member.User = user
		group.Members = append(group.Members, member)
	}

	// Get group creator
	creator := &models.User{ID: group.CreatorID}
	err = creator.Refresh()
	if err != nil {
		// If we can't find the creator, just continue without it
		// This shouldn't happen in normal operation
	} else {
		group.Creator = creator
	}

	RespondWithJSON(w, http.StatusOK, group)
}

// GetGroups returns all groups with optional filtering
func GetGroups(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var groups []models.Group
	rows, err := models.DB.Query("SELECT id, title, description, creator_id, created_at, updated_at FROM groups")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var group models.Group
		err = rows.Scan(&group.ID, &group.Title, &group.Description, &group.CreatorID, &group.CreatedAt, &group.UpdatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		groups = append(groups, group)
	}

	RespondWithJSON(w, http.StatusOK, groups)
}

// InviteToGroup handles group invitations
func InviteToGroup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	currentUser, err := AuthUser(r)
	if currentUser == nil || err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	invited_username := r.FormValue("username")
	invited_group_id := r.FormValue("group_id")

	if invited_username == "" || invited_group_id == "" {
		fmt.Println("Missing required fields")
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Check if the inviter is a member of the group
	var isMember bool
	err = models.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status IN ('member', 'accepted'))",
		invited_group_id, currentUser.ID).Scan(&isMember)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// If the inviter is not a member, they can't invite others
	if !isMember {
		http.Error(w, "You must be a member of the group to invite others", http.StatusForbidden)
		return
	}

	//get user id from username
	var invited_user_id int
	err = models.DB.QueryRow("SELECT id FROM users WHERE username = ?", invited_username).Scan(&invited_user_id)
	if err != nil {
		fmt.Println("User not found")
		http.Error(w, "User not found", http.StatusBadRequest)
		return
	}
	//check if the user is already invited
	var isInvited bool
	err = models.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?)",
		invited_group_id, invited_user_id).Scan(&isInvited)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if isInvited {
		http.Error(w, "User is already invited", http.StatusBadRequest)
		return
	}
	invited_group_idint, err := strconv.Atoi(invited_group_id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	member := &models.GroupMember{
		GroupID: invited_group_idint,
		UserID:  invited_user_id,
		Status:  "pending",
	}
	if err := member.Create(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Create notification for invited user
	notification := &models.Notification{
		UserID:   invited_user_id,
		Text:     "You have been invited to join a group",
		SenderID: currentUser.ID,
		Type:     "group_invitation",
		LinkID:   invited_group_idint,
		Date:     time.Now(),
	}

	if err := notification.Create(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = notification.Refresh()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	hub.SendToUser(invited_user_id, map[string]interface{}{
		"type":         "notification",
		"notification": notification,
	})

	RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Success"})
}

// RespondToInvitation handles accepting/rejecting group invitations
func RespondToInvitation(w http.ResponseWriter, r *http.Request) {
	
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	currentUser, err := AuthUser(r)
	if currentUser == nil || err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Extract the group ID from the URL path using regex
	// The URL path is expected to be in the format /groups/{id}/respond-invite
	// Let's use a simpler approach to extract the ID
	parts := strings.Split(r.URL.Path, "/")
	
	// Find the 'groups' part and get the ID after it
	var groupID string
	for i, part := range parts {
		if part == "groups" && i+1 < len(parts) {
			groupID = parts[i+1]
			break
		}
	}
	
	
	if groupID == "" {
		http.Error(w, "Missing group ID", http.StatusBadRequest)
		return
	}

	// Parse the form data
	err = r.ParseForm()
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Log all form values
	
	// Get the status from the form data
	status := r.FormValue("status")
	
	if status == "" {
		http.Error(w, "Missing status", http.StatusBadRequest)
		return
	}

	groupIDInt, err := strconv.Atoi(groupID)
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	if status == "accepted" {
		// Update the member status to 'member'
		_, err := models.DB.Exec("UPDATE group_members SET status = 'member' WHERE group_id = ? AND user_id = ? AND status = 'pending'",
			groupIDInt, currentUser.ID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		
		// Create notification for group creator
		var creatorID int
		err = models.DB.QueryRow("SELECT creator_id FROM groups WHERE id = ?", groupIDInt).Scan(&creatorID)
		if err == nil && creatorID > 0 {
			notification := &models.Notification{
				UserID:   creatorID,
				Text:     fmt.Sprintf("%s accepted your invitation to join the group", currentUser.Username),
				SenderID: currentUser.ID,
				Type:     "group_member_joined",
				LinkID:   groupIDInt,
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

			hub.SendToUser(creatorID,map[string]interface{}{
				"type":         "notification",
				"notification": notification,
			})
		}
	} else {
		// Delete the pending invitation
		_, err := models.DB.Exec("DELETE FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'pending'",
			groupIDInt, currentUser.ID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Success"})
}

// RequestToJoinGroup handles requests to join a group
func RequestToJoinGroup(w http.ResponseWriter, r *http.Request) {
	//add error fmtprintln for all errors 500
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	currentUser, err := AuthUser(r)
	if currentUser == nil || err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	groupID, err := strconv.Atoi(r.FormValue("group_id"))
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

		//check if user is already a member
		var isMember bool
		err = models.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?)",
			groupID, currentUser.ID).Scan(&isMember)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if isMember {
			http.Error(w, "You are already a member of this group", http.StatusBadRequest)
			return
		}

	member := &models.GroupMember{
		GroupID: groupID,
		UserID:  currentUser.ID,
		Status:  "requested",
	}
	if err := member.Create(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Get group
	var group models.Group
	err = models.DB.QueryRow("SELECT id, title, description, creator_id, created_at, updated_at FROM groups WHERE id = ?", groupID).Scan(
		&group.ID, &group.Title, &group.Description, &group.CreatorID, &group.CreatedAt, &group.UpdatedAt)
	if err != nil {
		fmt.Println("Error fetching group:", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Notify group creator
	notification := &models.Notification{
		UserID:   group.CreatorID,
		Text:     "A user has requested to join your group "+group.Title,
		SenderID: currentUser.ID,
		Type:     "group_request",
		LinkID:   groupID,
		Date:     time.Now(),
	}
	if err := notification.Create(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = notification.Refresh()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	hub.SendToUser(group.CreatorID, map[string]interface{}{
		"type":         "notification",
		"notification": notification,
	})

	RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Success"})
}

// RespondToJoinRequest handles creator's response to join requests
func RespondToJoinRequest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := AuthUser(r)
	if user == nil || err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse form data
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Error parsing form data: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Extract values from form data
	userIDStr := r.FormValue("user_id")
	groupIDStr := r.FormValue("group_id")
	status := r.FormValue("status")

	// Convert string IDs to integers
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID: "+err.Error(), http.StatusBadRequest)
		return
	}

	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		http.Error(w, "Invalid group ID: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Verify the responder is the group creator
	var group models.Group
	err = models.DB.QueryRow("SELECT id, title, description, creator_id, created_at, updated_at FROM groups WHERE id = ?", groupID).Scan(
		&group.ID, &group.Title, &group.Description, &group.CreatorID, &group.CreatedAt, &group.UpdatedAt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if group.CreatorID != user.ID {
		http.Error(w, "Only the group creator can respond to join requests", http.StatusForbidden)
		return
	}

	// Process the request based on status
	if status == "accepted" {
		_, err := models.DB.Exec("UPDATE group_members SET status = 'member' WHERE group_id = ? AND user_id = ? AND status = 'requested'",
			groupID, userID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else if status == "declined" {
		_, err := models.DB.Exec("DELETE FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'requested'",
			groupID, userID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		http.Error(w, "Invalid status value. Must be 'accepted' or 'declined'", http.StatusBadRequest)
		return
	}

	// Notify the requesting user of the decision
	notification := &models.Notification{
		UserID:   userID,
		Text:     "Your join request to group " + group.Title + " has been " + status,
		SenderID: user.ID,
		Type:     "group_request_response",
		LinkID:   groupID,
		Date:     time.Now(),
	}
	if err := notification.Create(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = notification.Refresh()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	hub.SendToUser(userID, map[string]interface{}{
		"type":         "notification",
		"notification": notification,
	})

	RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Success"})
}

// CreateGroupPost handles creation of posts within a group
func CreateGroupPost(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user := r.Context().Value("user").(*models.User)
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get group ID from URL path
	groupID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	// Parse form data
	if err := r.ParseMultipartForm(10 << 20); err != nil && err != http.ErrNotMultipart {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	title := r.FormValue("title")
	body := r.FormValue("body")

	if body == "" {
		http.Error(w, "Post body is required", http.StatusBadRequest)
		return
	}

	// Check if the group exists
	group := &models.Group{ID: groupID}
	if !group.Exists() {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// Check if user is a member of the group
	member := &models.GroupMember{GroupID: groupID, UserID: user.ID}
	if err := member.Refresh(); err != nil || member.Status != "member" {
		http.Error(w, "Only group members can create posts", http.StatusForbidden)
		return
	}

	// Create a regular post with group_id
	post := models.Post{
		Title:      title,
		Body:       body,
		UserID:     user.ID,
		Visibility: "group", // Set visibility to indicate it's a group post
		GroupID:    sql.NullInt64{Int64: int64(groupID), Valid: true},
	}

	// Handle media file if provided
	mediaFile, header, err := r.FormFile("media")
	if err == nil && mediaFile != nil {
		defer mediaFile.Close()
		// Create the post first to get an ID
		if err := post.Create(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Then store the media file
		if err := post.StoreMediaFile(mediaFile, header); err != nil {
			// If media storage fails, delete the post
			post.Delete()
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Post is already created, skip the create step below
		goto LoadRelations
	}

	if err := post.Create(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

LoadRelations:
	// Handle categories if provided
	categoriesStr := r.FormValue("categories")
	if categoriesStr != "" {
		var categoryIDs []int
		for _, categoryID := range strings.Split(categoriesStr, ",") {
			id, err := strconv.Atoi(categoryID)
			if err != nil && categoryID != "" {
				http.Error(w, "Invalid category ID", http.StatusBadRequest)
				return
			}
			if categoryID != "" {
				categoryIDs = append(categoryIDs, id)
			}
		}

		if len(categoryIDs) > 0 {
			if err := post.SyncCategories(categoryIDs); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}
	}

	// Load related data
	if err := post.GetRelations(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, post)
}

// CreateGroupEvent handles creation of events within a group
func CreateGroupEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user := r.Context().Value("user").(*models.User)
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var event models.GroupEvent
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Verify user is a member of the group
	var isMember bool
	err := models.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'member')",
		event.GroupID, user.ID).Scan(&isMember)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if !isMember {
		http.Error(w, "Only group members can create events", http.StatusForbidden)
		return
	}

	event.CreatorID = user.ID
	if err := event.Create(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	//get group
	group := &models.Group{ID: event.GroupID}
	if err := group.Refresh(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	members, err := group.GetMembers()
	
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// Notify all group members about the new event except the creator
	for _, member := range members {
		if member.UserID == user.ID {
			continue
		}

		notification := &models.Notification{
			UserID:   member.UserID,
			Text:     "New event in group " + group.Title + " named " + event.Title,
			SenderID: user.ID,
			Type:     "group_event",
			LinkID:   event.ID,
			Date:     time.Now(),
		}
		if err := notification.Create(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		err = notification.Refresh()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		hub.SendToUser(member.UserID, map[string]interface{}{
			"type":         "notification",
			"notification": notification,
		})
	}

	RespondWithJSON(w, http.StatusOK, event)
}

// GetGroupPosts returns all posts for a specific group
func GetGroupPosts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user := r.Context().Value("user").(*models.User)
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	groupID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	// Check if user is a member of the group
	var isMember bool
	err = models.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'member')",
		groupID, user.ID).Scan(&isMember)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if !isMember {
		http.Error(w, "You must be a member to view group posts", http.StatusForbidden)
		return
	}

	// Get all posts for the group using the model method
	posts, err := models.GetGroupPosts(groupID, user.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, posts)
}

// GetGroupEvents returns all events for a specific group
func GetGroupEvents(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user := r.Context().Value("user").(*models.User)
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	groupID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	// Check if user is a member of the group
	var isMember bool
	err = models.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'member')",
		groupID, user.ID).Scan(&isMember)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if !isMember {
		http.Error(w, "You must be a member to view group events", http.StatusForbidden)
		return
	}

	// Get all events for the group
	var events []models.GroupEvent
	rows, err := models.DB.Query(`
        SELECT ge.id, ge.group_id, ge.creator_id, ge.title, ge.description, ge.date_time,
            ge.created_at, ge.updated_at, u.username,
            (SELECT COUNT(*) FROM group_event_responses WHERE event_id = ge.id AND response = 'going') as going_count
        FROM group_events ge
        JOIN users u ON ge.creator_id = u.id
        WHERE ge.group_id = ?
        ORDER BY ge.date_time ASC
    `, groupID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var event models.GroupEvent
		var username string
		var goingCount int
		err = rows.Scan(&event.ID, &event.GroupID, &event.CreatorID, &event.Title,
			&event.Description, &event.DateTime, &event.CreatedAt,
			&event.UpdatedAt, &username, &goingCount)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		event.Creator = &models.User{Username: username}

		// Get ALL responses for this event
		responseRows, err := models.DB.Query(`
			SELECT ger.id, ger.event_id, ger.user_id, ger.response, ger.created_at, ger.updated_at 
			FROM group_event_responses ger 
			WHERE ger.event_id = ?
		`, event.ID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer responseRows.Close()

		for responseRows.Next() {
			var response models.GroupEventResponse
			err = responseRows.Scan(&response.ID, &response.EventID, &response.UserID, &response.Response, &response.CreatedAt, &response.UpdatedAt)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			event.Responses = append(event.Responses, &response)
		}

		events = append(events, event)
	}

	RespondWithJSON(w, http.StatusOK, events)
}

// RespondToEvent handles user responses to group events
func RespondToEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := AuthUser(r)
	if user == nil || err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Extract eventId from URL path
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 5 {
		http.Error(w, "Invalid URL path", http.StatusBadRequest)
		return
	}

	eventIdStr := parts[len(parts)-2] // Format: /groups/{groupId}/events/{eventId}/respond
	eventId, err := strconv.Atoi(eventIdStr)
	if err != nil {
		http.Error(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	var response models.GroupEventResponse
	if err := json.NewDecoder(r.Body).Decode(&response); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Set the EventID from the URL parameter
	response.EventID = eventId

	// Verify user is a member of the group
	var groupID int
	err = models.DB.QueryRow("SELECT group_id FROM group_events WHERE id = ?", response.EventID).Scan(&groupID)
	if err != nil {
		fmt.Println(904)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var isMember bool
	err = models.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'member')",
		groupID, user.ID).Scan(&isMember)
	if err != nil {
		fmt.Println(903)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if !isMember {
		http.Error(w, "Only group members can respond to events", http.StatusForbidden)
		return
	}
	//check if user already has response
	var existingResponse models.GroupEventResponse
	err = models.DB.QueryRow("SELECT id, response FROM group_event_responses WHERE event_id = ? AND user_id = ?",
		response.EventID, user.ID).Scan(&existingResponse.ID, &existingResponse.Response)
	if err == nil {
		//update his response
		_, err = models.DB.Exec("UPDATE group_event_responses SET response = ? WHERE event_id = ? AND user_id = ?",
			response.Response, response.EventID, user.ID)
		if err != nil {
			fmt.Println(901)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		//create new response
		response.UserID = user.ID
		if err := response.Create(); err != nil {
			fmt.Println(902)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	RespondWithJSON(w, http.StatusOK, response)
}
