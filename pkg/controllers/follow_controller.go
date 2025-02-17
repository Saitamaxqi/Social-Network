package controllers

import (
	"forum/pkg/models"
	"net/http"
	"strconv"
)

func FollowController(w http.ResponseWriter, r *http.Request) {
    switch r.Method {
    case "POST":
        CreateFollow(w, r)
    case "PUT":
        UpdateFollow(w, r)
    case "DELETE":
        DeleteFollow(w, r)
    default:
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
    }
}

func CreateFollow(w http.ResponseWriter, r *http.Request) {
    currentUser, err := AuthUser(r)
    if err != nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    targetUserID, err := strconv.Atoi(r.FormValue("user_id"))
    if err != nil {
        http.Error(w, "Invalid user ID", http.StatusBadRequest)
        return
    }
	if targetUserID == currentUser.ID {
        http.Error(w, "You cannot follow yourself", http.StatusBadRequest)
        return
    }

    follow := &models.Follow{
        FollowerID: currentUser.ID,
        FollowingID: targetUserID,
    }
	follow.LoadRelations()

    err = follow.Create()
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    RespondWithJSON(w, http.StatusOK, follow)
}

func UpdateFollow(w http.ResponseWriter, r *http.Request) {
    currentUser, err := AuthUser(r)
    if err != nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    followID, err := strconv.Atoi(r.PathValue("id"))
    if err != nil {
        http.Error(w, "Invalid follow ID", http.StatusBadRequest)
        return
    }

    follow := &models.Follow{ID: followID}
    err = follow.GetByID(followID)
    if err != nil {
        http.Error(w, "Follow request not found", http.StatusNotFound)
        return
    }

    if follow.FollowingID != currentUser.ID {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    status := r.FormValue("status")
    if status != "accepted" && status != "declined" {
        http.Error(w, "Invalid status", http.StatusBadRequest)
        return
    }
	//make so if the statue is declined it deletes the follow request
	if status == "declined" {
		err = follow.Delete()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Follow request declined"})
		return
	}

    follow.Status = status
    err = follow.Update()
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    RespondWithJSON(w, http.StatusOK, follow)
}

func DeleteFollow(w http.ResponseWriter, r *http.Request) {
    currentUser, err := AuthUser(r)
    if err != nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    followID, err := strconv.Atoi(r.PathValue("id"))
    if err != nil {
        http.Error(w, "Invalid follow ID", http.StatusBadRequest)
        return
    }

    follow := &models.Follow{ID: followID}
    err = follow.GetByID(followID)
    if err != nil {
        http.Error(w, "Follow relationship not found", http.StatusNotFound)
        return
    }

    if follow.FollowerID != currentUser.ID {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    err = follow.Delete()
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Unfollowed successfully"})
}
