package controllers

import (
	"fmt"
	"forum/pkg/consts"
	"forum/pkg/models"
	"net/http"
	"strconv"
	"time"
)

func ModeratorController(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		ModeratorRequests(w, r)
	case "POST":
		RequestModerator(w, r)
	case "PUT":
		ApproveModerator(w, r)
	case "DELETE":
		RejectModerator(w, r)
	}
}

func ModeratorRequests(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	requests, err := user.ModeratorRequests()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, requests)
}

func RequestModerator(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	if user.Type != consts.USER {
		http.Error(w, "User is already a moderator", http.StatusBadRequest)
		return
	}

	user.Requested = true

	err = user.Update()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	notification := models.Notification{
		UserID:   1,
		Text:     fmt.Sprintf("%s has requested to be a moderator", user.Username),
		SenderID: user.ID,
		Type:     consts.USER,
		LinkID:   user.ID,
		Date:     time.Now(),
	}

	err = notification.Create()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	user.HideDetails()

	RespondWithJSON(w, http.StatusOK, user)
}

func ApproveModerator(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user := &models.User{ID: id}
	err = user.Refresh()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	user.Type = consts.MODERATOR
	user.Requested = false

	err = user.Update()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	notification := &models.Notification{
		UserID:   user.ID,
		Text:     "You have been approved as a moderator",
		SenderID: 1,
		Type:     consts.MODERATOR,
		LinkID:   user.ID,
		Date:     time.Now(),
	}

	err = notification.Create()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	user.HideDetails()

	RespondWithJSON(w, http.StatusOK, user)
}

func RejectModerator(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user := &models.User{ID: id}
	err = user.Refresh()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	user.Requested = false

	err = user.Update()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	notification := &models.Notification{
		UserID:   user.ID,
		Text:     "Your moderator request has been rejected",
		SenderID: 1,
		Type:     consts.MODERATOR,
		LinkID:   user.ID,
		Date:     time.Now(),
	}

	err = notification.Create()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	user.HideDetails()

	RespondWithJSON(w, http.StatusOK, user)
}
