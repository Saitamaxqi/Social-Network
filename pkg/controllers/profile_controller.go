package controllers

import (
	"forum/pkg/models"
	"net/http"
	"strconv"
)

func ProfileController(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		GetProfile(w, r)
	case "PUT":
		UpdateProfile(w, r)
	}
}

func GetProfile(w http.ResponseWriter, r *http.Request) {
    currentUser, _ := AuthUser(r)
    
    // Get profile user ID from URL
    profileID, err := strconv.Atoi(r.PathValue("id"))
    if err != nil {
        http.Error(w, "Invalid profile ID", http.StatusBadRequest)
        return
    }

    profileUser := &models.User{ID: profileID}
    err = profileUser.Refresh()
    if err != nil {
        http.Error(w, "Profile not found", http.StatusNotFound)
        return
    }

    // Check visibility
    visible, err := profileUser.IsProfileVisibleTo(currentUser.ID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    if !visible {
        http.Error(w, "Profile is private", http.StatusForbidden)
        return
    }

    // Get user activity
    activity, err := profileUser.GetActivity()
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    // Get profile stats
    stats, err := models.GetUserStats(profileUser.ID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    // Prepare response
    response := map[string]interface{}{
        "user":     profileUser,
        "activity": activity,
        "stats":    stats,
        "isOwner":  currentUser.ID == profileUser.ID,
    }

    RespondWithJSON(w, http.StatusOK, response)
}

func UpdateProfile(w http.ResponseWriter, r *http.Request) {
    currentUser, err := AuthUser(r)
    if err != nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    // Parse form values
    age, err := strconv.Atoi(r.FormValue("age"))
    if err != nil {
        http.Error(w, "Invalid age", http.StatusBadRequest)
        return
    }

    // Update all user fields
    currentUser.Username = r.FormValue("username")
    currentUser.Age = age
    currentUser.Gender = r.FormValue("gender")
    currentUser.FirstName = r.FormValue("first_name")
    currentUser.LastName = r.FormValue("last_name")
    currentUser.Email = r.FormValue("email")
    currentUser.ProfileType = r.FormValue("profile_type")
    currentUser.AboutMe = r.FormValue("about_me")

    // Handle optional password update
    if password := r.FormValue("password"); password != "" {
        currentUser.Password = password
    }

    // Handle avatar upload if provided
    file, header, err := r.FormFile("avatar")
    if err == nil && file != nil {
        defer file.Close()
        err = currentUser.StoreAvatarFile(file, header)
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
    }

    // Update user in database
    err = currentUser.Update()
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    RespondWithJSON(w, http.StatusOK, currentUser)
}

