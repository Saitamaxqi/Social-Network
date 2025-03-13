package controllers

import (
	"encoding/json"
	"forum/pkg/models"
	"net/http"
	"strconv"
)

func CloseFriendController(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		GetCloseFriends(w, r)
	case "POST":
		AddCloseFriend(w, r)
	case "DELETE":
		RemoveCloseFriend(w, r)
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

	// Create close friend relationship
	closeFriend := &models.CloseFriend{
		UserID:   user.ID,
		FriendID: requestData.FriendID,
	}

	err = closeFriend.Create()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Get the full friend details
	closeFriend.Friend = friend

	RespondWithJSON(w, http.StatusCreated, closeFriend)
}

func RemoveCloseFriend(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	friendID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid friend ID", http.StatusBadRequest)
		return
	}

	closeFriend := &models.CloseFriend{
		UserID:   user.ID,
		FriendID: friendID,
	}

	err = closeFriend.Delete()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Friend removed from close friends"})
}
