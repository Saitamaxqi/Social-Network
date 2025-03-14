package controllers

import (
	"fmt"
	"forum/pkg/models"
	"net/http"
	"strconv"
	"time"
)

func FollowController(w http.ResponseWriter, r *http.Request) {
    switch r.Method {
    case "POST":
        CreateFollow(w, r)
    case "PUT":
        UpdateFollow(w, r)
    case "DELETE":
        DeleteFollow(w, r)
    case "GET":
        if r.URL.Path == "/follow/followers" {
            GetFollowers(w, r)
        } else {
            http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        }
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
    if follow.Status == "pending" {
        notification := &models.Notification{
            UserID:   targetUserID,
            Text:     fmt.Sprintf("%s requested to follow you", currentUser.Username),
            SenderID: currentUser.ID,
            Type:     "follow request",
            LinkID:   follow.ID,
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
        hub.SendToUser(targetUserID, map[string]interface{}{
            "type":         "notification",
            "notification": notification,
        })
    } else {
        notification := &models.Notification{   
            UserID:   targetUserID,
            Text:     fmt.Sprintf("%s started following you", currentUser.Username),
            SenderID: currentUser.ID,
            Type:     "follow",
            LinkID:   currentUser.ID,
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
        hub.SendToUser(targetUserID, map[string]interface{}{
            "type":         "notification",
            "notification": notification,
        })
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
		// Send notification to follower about declined request
		notification := &models.Notification{
			UserID:   follow.FollowerID,
			Text:     fmt.Sprintf("%s declined your follow request", currentUser.Username),
			SenderID: currentUser.ID,
			Type:     "follow",
			LinkID:   currentUser.ID,
			Date:     time.Now(),
		}

		// Save notification to database
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
		// Send real-time notification
		hub.SendToUser(follow.FollowerID, map[string]interface{}{
			"type":         "notification",
			"notification": notification,
		})

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

    // Send notification to follower about accepted request
    notification := &models.Notification{
        UserID:   follow.FollowerID,
        Text:     fmt.Sprintf("%s accepted your follow request", currentUser.Username),
        SenderID: currentUser.ID,
        Type:     "follow",
        LinkID:   currentUser.ID,
        Date:     time.Now(),
    }

    // Save notification to database
    err = notification.Create()
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    err =notification.Refresh()
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    // Send real-time notification
    hub.SendToUser(follow.FollowerID, map[string]interface{}{
        "type":         "notification",
        "notification": notification,
    })

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

func GetFollowers(w http.ResponseWriter, r *http.Request) {
    user, err := AuthUser(r)
    if err != nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    follow := &models.Follow{}
    followers, err := follow.GetFollowers(user.ID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    RespondWithJSON(w, http.StatusOK, followers)
}
