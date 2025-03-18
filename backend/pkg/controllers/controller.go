package controllers

import (
	"encoding/json"
	"errors"
	"social/backend/pkg/models"
	"net/http"
)

func RespondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, _ := json.Marshal(payload)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

func AuthUser(r *http.Request) (*models.User, error) {
	cookie, err := r.Cookie("session")
	if err != nil {
		return nil, err
	}

	uuid := cookie.Value
	session, err := models.GetSessionByUUID(uuid)
	if err != nil {
		return nil, errors.New("session not found")
	}

	if session.Expired() {
		err = session.Delete()
		if err != nil {
			return nil, err
		}
		return nil, errors.New("session expired")
	}

	user, err := session.User()
	

	return user, err
}
