package controllers

import (
	"forum/pkg/models"
	"net/http"
	"strconv"
	"time"
)

// SendGroupMessage handles sending a new message to a group
func SendGroupMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user := r.Context().Value("user").(*models.User)
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	groupID, err := strconv.Atoi(r.URL.Query().Get("group_id"))
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	// Verify user is a member of the group
	var isMember bool
	err = models.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'member')",
		groupID, user.ID).Scan(&isMember)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if !isMember {
		http.Error(w, "Only group members can send messages", http.StatusForbidden)
		return
	}

	content := r.URL.Query().Get("messageInput")
	if content == "" {
		http.Error(w, "Message content cannot be empty", http.StatusBadRequest)
		return
	}

	err = models.SaveGroupMessage(groupID, user.ID, content)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Get all group members for notification
	rows, err := models.DB.Query(`
		SELECT user_id 
		FROM group_members 
		WHERE group_id = ? AND user_id != ? AND status = 'member'`,
		groupID, user.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Notify all group members about the new message
	for rows.Next() {
		var memberID int
		if err := rows.Scan(&memberID); err != nil {
			continue
		}

		notification := &models.Notification{
			UserID:   memberID,
			Text:     "New message in group",
			SenderID: user.ID,
			Type:     "group_message",
			LinkID:   groupID,
			Date:     time.Now(),
		}
		notification.Create()
	}

	RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Message sent successfully"})
}

// GetGroupMessages retrieves messages for a specific group with pagination
func GetGroupMessages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user := r.Context().Value("user").(*models.User)
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	groupID, err := strconv.Atoi(r.URL.Query().Get("group_id"))
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	// Verify user is a member of the group
	var isMember bool
	err = models.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'member')",
		groupID, user.ID).Scan(&isMember)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if !isMember {
		http.Error(w, "Only group members can view messages", http.StatusForbidden)
		return
	}

	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil {
		page = 0 // Default to first page if not specified
	}

	messages, err := models.GetGroupMessageHistory(groupID, 10, page*10)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, messages)
}
