package controllers

import (
	"social/backend/pkg/models"
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

	groupID, err := strconv.Atoi(r.PathValue("id"))
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
	group := models.Group{ID: groupID}
	err = group.Refresh()
	if err != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}
	members, err := group.GetMembers()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// Notify all group members about the new message
	for _, member := range members {
		if member.UserID == user.ID {
			continue
		}

		notification := &models.Notification{
			UserID:   member.UserID,
			Text:     "New message in group " + group.Title,
			SenderID: user.ID,
			Type:     "group_message",
			LinkID:   group.ID,
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

		hub.SendToUser(member.UserID, map[string]interface{}{
			"type": "group_message",
			"message": map[string]interface{}{
				"content":    content,
				"sender":     user,
				"group_id":   group.ID,
				"created_at": time.Now(),
				"group":      group,
			},
		})

		hub.SendToUser(member.UserID, map[string]interface{}{
			"type":         "notification",
			"notification": notification,
		})
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

	groupID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}
	group := models.Group{ID: groupID}
	err = group.Refresh()
	if err != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
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
	response := map[string]interface{}{
		"messages": messages,
		"group":    group,
	}

	RespondWithJSON(w, http.StatusOK, response)
}
