package controllers

import (
	"forum/pkg/models"
	"net/http"
	"strconv"
)

func NotificationController(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		IndexNotifications(w, r)
	case "PUT":
		if r.PathValue("id") == "" {
			UpdateAllNotifications(w, r)
		} else {
			UpdateNotification(w, r)
		}
	}
}

func IndexNotifications(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	notifications, err := user.Notifications()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, notifications)
}

func UpdateNotification(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	notificationID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Notification ID is required", http.StatusBadRequest)
		return
	}

	notification := &models.Notification{ID: notificationID}
	err = notification.Refresh()
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	if notification.UserID != user.ID {
		http.Error(w, "You are not authorized to update this notification", http.StatusUnauthorized)
		return
	}

	notification.Seen = !notification.Seen

	err = notification.Update()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, notification)
}

func UpdateAllNotifications(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	notifications, err := user.Notifications()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, notification := range notifications {
		notification.Seen = true
		err = notification.Update()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	RespondWithJSON(w, http.StatusOK, map[string]string{"message": "All notifications are updated"})
}
