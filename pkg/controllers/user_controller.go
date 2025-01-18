package controllers

import (
	"forum/pkg/consts"
	"forum/pkg/models"
	"net/http"
	"strconv"
)

func UserController(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		if r.PathValue("id") != "" {
			ShowUser(w, r)
		} else {
			IndexUser(w, r)
		}
	case "PUT":
		UpdateUser(w, r)
	case "DELETE":
		DestroyUser(w, r)
	}
}

func IndexUser(w http.ResponseWriter, r *http.Request) {
	user := &models.User{}
	users, err := user.Index()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, users)
}

func UpdateUser(w http.ResponseWriter, r *http.Request) {
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

	if r.FormValue("type") == consts.USER && user.Type == consts.MODERATOR {
		err = user.DeleteReports()
		if err != nil {
			return
		}
	} else if r.FormValue("type") == consts.MODERATOR && user.Type == consts.USER {
		user.Requested = false
	}

	user.Type = r.FormValue("type")
	err = user.Update()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, user)
}

func DestroyUser(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user := &models.User{ID: id}
	err = user.Delete()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, user)
}

func ShowUser(w http.ResponseWriter, r *http.Request) {
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

	RespondWithJSON(w, http.StatusOK, user)
}
