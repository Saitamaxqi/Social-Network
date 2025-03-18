package controllers

import (
	"fmt"
	"forum/pkg/models"
	"net/http"
	"strconv"
	"time"
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

	//Check visibility
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
		fmt.Println("Error getting activity:", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Get profile stats
	stats, err := models.GetUserStats(profileUser.ID)
	if err != nil {
		fmt.Println("Error getting stats:", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Check if user is a close friend
	isCloseFriend, err := profileUser.IsCloseFriend(currentUser.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Prepare response
	response := map[string]interface{}{
		"user":          profileUser,
		"activity":      activity,
		"stats":         stats,
		"isOwner":       currentUser.ID == profileUser.ID,
		"isCloseFriend": isCloseFriend,
	}

	RespondWithJSON(w, http.StatusOK, response)
}

func UpdateProfile(w http.ResponseWriter, r *http.Request) {
	fmt.Println("UpdateProfile called with method:", r.Method)

	// Parse multipart form data
	parseErr := r.ParseMultipartForm(10 << 20) // 10 MB max memory
	if parseErr != nil {
		parseErr = r.ParseForm()
		if parseErr != nil {
			http.Error(w, "Error parsing form data", http.StatusBadRequest)
			return
		}
	}

	currentUser, err := AuthUser(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse form values
	dateOfBirthStr := r.FormValue("date_of_birth")

	// Try different date formats
	var dateOfBirth time.Time

	// Try standard ISO format
	if dateOfBirthStr != "" {
		// Try different date formats
		formats := []string{
			"2006-01-02",           // ISO format
			"2006-01-02T15:04:05Z", // ISO with time
			"01/02/2006",           // US format
			"02/01/2006",           // UK format
		}

		parsed := false
		var parseErr error
		for _, format := range formats {
			dateOfBirth, parseErr = time.Parse(format, dateOfBirthStr)
			if parseErr == nil {
				parsed = true
				break
			}
		}

		if !parsed {
			http.Error(w, "Invalid date of birth format. Please use YYYY-MM-DD", http.StatusBadRequest)
			return
		}
	} else {
		// If date is empty, keep the current value
		dateOfBirth = currentUser.DateOfBirth
	}

	// Update all user fields
	currentUser.Username = r.FormValue("username")
	currentUser.DateOfBirth = dateOfBirth
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
