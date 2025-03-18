package controllers

import (
	"encoding/json"
	"forum/pkg/models"
	"net/http"
)

func CloseFriendController(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		GetCloseFriends(w, r)
	case "POST":
		AddCloseFriend(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func GetCloseFriends(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	closeFriend := &models.CloseFriend{}
	closeFriends, err := closeFriend.GetByUser(user.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, closeFriends)
}

func AddCloseFriend(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	var requestData struct {
		FriendID int `json:"friend_id"`
	}

	err = json.NewDecoder(r.Body).Decode(&requestData)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if requestData.FriendID == 0 {
		http.Error(w, "Friend ID is required", http.StatusBadRequest)
		return
	}

	// Check if friend exists
	friend := &models.User{ID: requestData.FriendID}
	err = friend.Refresh()
	if err != nil {
		http.Error(w, "Friend not found", http.StatusNotFound)
		return
	}

	// Check if already a close friend
	isCloseFriend, err := friend.IsCloseFriend(user.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Initialize close friend relationship object
	closeFriend := &models.CloseFriend{
		UserID:   user.ID,
		FriendID: requestData.FriendID,
	}

	if isCloseFriend {
		// If already a close friend, delete the relationship
		err = closeFriend.Delete()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		RespondWithJSON(w, http.StatusOK, map[string]interface{}{
			"message":      "Friend removed from close friends",
			"isCloseFriend": false,
		})
	} else {
		// If not a close friend, create the relationship
		err = closeFriend.Create()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Get the full friend details
		closeFriend.Friend = friend

		RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
			"closeFriend":   closeFriend,
			"isCloseFriend": true,
		})
	}
}
