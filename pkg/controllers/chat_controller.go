package controllers

import (
	"fmt"
	"forum/pkg/consts"
	"forum/pkg/models"
	"net/http"
	"strconv"
	"time"
)

func OnlineUsersController(users []models.User) map[string]bool {
	onlineUsers := make(map[string]bool)

	for _, user := range users {
		session, err := models.GetSessionByUserID(user.ID)
		if err != nil {
			onlineUsers[user.Username] = false
			continue
		}
		onlineUsers[user.Username] = !session.Expired()
	}
	return onlineUsers
}

func RecentChatsController(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	recentChats, err := models.GetAllUsersOrderedByRecentChats(user.ID)
	if err != nil {
		fmt.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	onlineUsers := OnlineUsersController(recentChats)

	// Get follow statuses for all users the current user has initiated follows with
	followStatuses, err := models.GetFollowStatuses(user.ID)
	if err != nil {
		fmt.Printf("Error getting follow statuses: %v\n", err)
		followStatuses = make(map[int]*models.FollowStatus)
	}

	// Create a map for the frontend with usernames as keys and follow info
	type FollowInfo struct {
		ID     int    `json:"id"`
		Status string `json:"status"`
	}
	followStatusMap := make(map[string]*FollowInfo)
	for _, chatUser := range recentChats {
		if status, exists := followStatuses[chatUser.ID]; exists {
			followStatusMap[chatUser.Username] = &FollowInfo{ID: status.ID, Status: status.Status}
		} else {
			followStatusMap[chatUser.Username] = &FollowInfo{ID: 0, Status: "none"}
		}
	}

	listJSON := map[string]interface{}{
		"onlineUsers":    onlineUsers,
		"recentChats":    recentChats,
		"followStatuses": followStatusMap,
	}
	RespondWithJSON(w, http.StatusOK, listJSON)
}

// make the handler for the post a private message
func PostPrivateMessageController(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	recipientID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid recipient ID", http.StatusBadRequest)
		return
	}

	message := r.URL.Query().Get("messageInput")
	fmt.Println("Saving message :::", message)
	err = models.SavePrivateMessage(user.ID, recipientID, message)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	notification := &models.Notification{
		UserID:   recipientID,
		Text:     fmt.Sprintf("%s sent you a message", user.Username),
		SenderID: user.ID,
		Type:     consts.Message,
		LinkID:   user.ID,
		Date:     time.Now(),
	}

	hub.SendToUser(recipientID, map[string]interface{}{
		"type":         "notification",
		"notification": notification,
	})

	err = notification.Create()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	//add a unique id for each message
	hub.SendToUser(recipientID, map[string]interface{}{
		"type": "message",
		"message": map[string]interface{}{
			"content":    message,
			"sender":     user,
			"created_at": time.Now(),
		},
	})
	RespondWithJSON(w, http.StatusOK, "Message sent")
}

func GetPrivateMessagesController(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	recipientID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid recipient ID", http.StatusBadRequest)
		return
	}
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	messages, err := models.GetChatHistory(user.ID, recipientID, 10, page*10)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	RespondWithJSON(w, http.StatusOK, messages)
}
