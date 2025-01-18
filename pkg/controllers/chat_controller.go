package controllers

import (
	// "encoding/json"
	// "encoding/json"
	"encoding/json"
	"fmt"
	"forum/pkg/consts"
	"forum/pkg/models"
	"strconv"
	"time"

	// "forum/pkg/utils"
	"net/http"
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
    fmt.Println(recentChats)
    fmt.Println(onlineUsers)
    //create json object with online Users and recent chats
    listJSON := map[string]interface{}{
        "onlineUsers": onlineUsers,
        "recentChats": recentChats,
    }
    RespondWithJSON(w, http.StatusOK, listJSON)
}

//make the handler for the post a private message
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
    //get user with this id
    recipient, err := models.GetUserByID(recipientID)
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
    
    notificationJSON, _ := json.Marshal(map[string]interface{}{
        "type": "notification",
        "notification": notification,
    })
    hub.Broadcast <- notificationJSON

	err = notification.Create()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
    //add a unique id for each message
    messageJSON, _ := json.Marshal(map[string]interface{}{
        "type": "message",
        "message": message,
        "recipient": recipient,
        "sender": user,
        "created_at": time.Now(),
    })
    hub.Broadcast <- messageJSON
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
    messages, err := models.GetChatHistory(user.ID, recipientID, 10, page*10  )
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    RespondWithJSON(w, http.StatusOK, messages)
}