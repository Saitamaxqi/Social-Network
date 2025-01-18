package controllers

import (
	"net/http"
)

func ProfileController(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		ShowProfile(w, r)
	case "PUT":
		UpdateProfile(w, r)
	}
}

func ShowProfile(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	user.HideDetails()

	RespondWithJSON(w, http.StatusOK, user)
}

func UpdateProfile(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	if r.FormValue("password") != r.FormValue("confirm_password") {
		http.Error(w, "Passwords do not match", http.StatusBadRequest)
		return
	}

	user.Username = r.FormValue("username")
	user.Email = r.FormValue("email")
	user.Password = r.FormValue("password")

	err = user.Update()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	user.HideDetails()

	RespondWithJSON(w, http.StatusOK, user)
}
