package controllers

import (
	"encoding/json"
	// "fmt"
	"forum/pkg/consts"
	"forum/pkg/models"
	"net/http"
	"strconv"
	"time"
)

func AuthController(w http.ResponseWriter, r *http.Request) {
	switch r.URL.Path {
	case "/login":
		Login(w, r)
	case "/register":
		Register(w, r)
	case "/logout":
		Logout(w, r)
	case "/check-session":
		CheckSession(w, r)
	case "/login-session":
		LoginSession(w, r)
	}
}

func Login(w http.ResponseWriter, r *http.Request) {
	email := r.FormValue("identifier")
	password := r.FormValue("password")
	user, err := models.GetUserByNicknameOrEmail(email)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if !user.ComparePassword(password) {
		http.Error(w, "Password is incorrect", http.StatusBadRequest)
		return
	}

	login(w, r, user)
}

func Register(w http.ResponseWriter, r *http.Request) {
	age, err := strconv.Atoi(r.FormValue("age"))
	if err != nil {
		http.Error(w, "Invalid age", http.StatusBadRequest)
		return
	}

	// Generate username if not provided
	username := r.FormValue("username")
	if username == "" {
		username = r.FormValue("first_name") + "_" + r.FormValue("last_name")
	}

	// Create new user with all fields
	user := &models.User{
		Username:    username,
		Age:         age,
		Gender:      r.FormValue("gender"),
		FirstName:   r.FormValue("first_name"),
		LastName:    r.FormValue("last_name"),
		Email:       r.FormValue("email"),
		Password:    r.FormValue("password"),
		Type:        consts.USER,
		ProfileType: r.FormValue("profile_type"),
		AboutMe:     r.FormValue("about_me"),
	}

	// Create the user first to get an ID
	if err := user.Create(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Handle avatar upload if provided
	file, header, err := r.FormFile("avatar")
	if err == nil && file != nil {
		defer file.Close()
		err = user.StoreAvatarFile(file, header)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	login(w, r, user)
}

func Logout(w http.ResponseWriter, r *http.Request) {

	user, err := AuthUser(r)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	session, err := user.Session()
	if err != nil {

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = session.Delete()
	if err != nil {

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:   "session",
		Value:  "",
	})

	offlineJSON, _ := json.Marshal(map[string]interface{}{
		"type": "user status",
	})
	hub.Broadcast <- offlineJSON

	RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Logged out"})
}

func login(w http.ResponseWriter, r *http.Request, user *models.User) {
	session, _ := user.Session() // Get the existing session

	if session.Exists() {
		err := session.Delete()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:     "session",
			Value:    "",
			Path:     "/",
			SameSite: http.SameSiteLaxMode,
		})
	}

	userSession, err := user.NewSession(0) // Create a session with no expiry
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    userSession.UUID,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})

	user.Password = "" // Do not return the password
	user.SessionUUID = userSession.UUID

	onlineJSON, _ := json.Marshal(map[string]interface{}{
		"type": "user status",
	})
	hub.Broadcast <- onlineJSON

	RespondWithJSON(w, http.StatusOK, user)
}

func loginThirdParty(w http.ResponseWriter, r *http.Request, user *models.User) {
	session, _ := user.Session() // Get the existing session

	if session.Exists() {
		err := session.Delete()
		if err != nil {
			MessageController(w, r, err.Error(), "error")
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:     "session",
			Value:    "",
			Path:     "/",
			SameSite: http.SameSiteLaxMode,
		})
	}

	userSession, err := user.NewSession(time.Hour * 24) // Create a new session with 24 hour expiry
	if err != nil {
		MessageController(w, r, err.Error(), "error")
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    userSession.UUID,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})

	user.Password = "" // Do not return the password
	user.SessionUUID = userSession.UUID
	onlineJSON, _ := json.Marshal(map[string]interface{}{
		"type": "user status",
	})
	hub.Broadcast <- onlineJSON
	HomeController(w, r)

}

func CheckSession(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	user.HideDetails()
	RespondWithJSON(w, http.StatusOK, user)
}

func LoginSession(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		MessageController(w, r, err.Error(), "error")
		return
	}

	user.HideDetails()
	RespondWithJSON(w, http.StatusOK, user)
}
