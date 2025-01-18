package controllers

import (
	"forum/pkg/models"
	"net/http"
	"strconv"
)

func CategoryController(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		if r.PathValue("id") != "" {
			ShowCategory(w, r)
		} else {
			IndexCategory(w, r)
		}
	case "POST":
		CreateCategory(w, r)
	case "PUT":
		UpdateCategory(w, r)
	case "DELETE":
		DeleteCategory(w, r)
	}
}

func IndexCategory(w http.ResponseWriter, r *http.Request) {
	category := &models.Category{}
	categories, err := category.Index()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, categories)
}

func CreateCategory(w http.ResponseWriter, r *http.Request) {
	category := &models.Category{
		Name: r.FormValue("name"),
	}

	err := category.Create()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusCreated, category)
}

func UpdateCategory(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	category := &models.Category{
		ID: id,
	}

	err = category.Refresh()
	if err != nil {
		return
	}

	category.Name = r.FormValue("name")
	err = category.Update()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, category)
}

func DeleteCategory(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	category, err := models.GetByID("category", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = category.Delete()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, category)
}

func ShowCategory(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	category, err := models.GetByID("category", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, category)
}
