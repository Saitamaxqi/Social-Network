package controllers

import (
	"net/http"
)

func HomeController(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "web/html/index.html")
}

func MessageController(w http.ResponseWriter, r *http.Request, message string, t string) {
	http.Redirect(w, r, "/message?message="+message+"&type="+t, http.StatusSeeOther)
}
