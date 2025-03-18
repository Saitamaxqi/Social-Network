package controllers

import (
	"net/http"
)

func DefaultController(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		if r.PathValue("id") != "" {
			show(w, r)
		} else {
			index(w, r)
		}
	case "POST":
		create(w, r)
	case "PUT":
		update(w, r)
	case "DELETE":
		destroy(w, r)
	}
}

func index(w http.ResponseWriter, r *http.Request) {
	// Index action
}

func create(w http.ResponseWriter, r *http.Request) {
	// Create action
}

func update(w http.ResponseWriter, r *http.Request) {
	// Update action
}

func destroy(w http.ResponseWriter, r *http.Request) {
	// Delete action
}

func show(w http.ResponseWriter, r *http.Request) {
	// Show action
}
