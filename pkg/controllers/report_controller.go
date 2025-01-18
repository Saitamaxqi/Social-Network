package controllers

import (
	"fmt"
	"forum/pkg/consts"
	"forum/pkg/models"
	"net/http"
	"strconv"
	"time"
)

func ReportController(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		if r.PathValue("id") != "" {
			ShowReport(w, r)
		} else {
			IndexReports(w, r)
		}
	case "POST":
		CreateReport(w, r)
	case "PUT":
		UpdateReport(w, r)
	case "DELETE":
		DeleteReport(w, r)
	}
}

func IndexReports(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	var reports interface{}
	switch user.Type {
	case consts.ADMIN:
		reports, err = (&models.Report{}).Index()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	case consts.MODERATOR:
		reports, err = user.Reports()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	RespondWithJSON(w, http.StatusOK, reports)
}

func CreateReport(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	postID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	report := &models.Report{
		UserID:   user.ID,
		Content:  r.FormValue("content"),
		Type:     r.FormValue("type"),
		PostID:   postID,
		Approved: false,
	}

	if report.Reported(user) {
		http.Error(w, "report already exists", http.StatusBadRequest)
		return
	}

	err = report.Create()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	notification := &models.Notification{
		UserID:   1,
		Text:     fmt.Sprintf("New report from moderator %s", user.Username),
		SenderID: user.ID,
		Type:     consts.REPORT,
		LinkID:   report.ID,
		Date:     time.Now(),
	}

	err = notification.Create()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, report)
}

func UpdateReport(w http.ResponseWriter, r *http.Request) {
	reportID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	report := &models.Report{ID: reportID}
	err = report.Refresh()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if report.Approved {
		http.Error(w, "report already approved", http.StatusBadRequest)
		return
	}

	report.Content = r.FormValue("content")
	report.Type = r.FormValue("type")

	err = report.Update()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, report)
}

func DeleteReport(w http.ResponseWriter, r *http.Request) {
	user, err := AuthUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	reportID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	report := &models.Report{ID: reportID}
	err = report.Refresh()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if user.Type != consts.ADMIN && user.ID != report.UserID {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	err = report.Delete()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, report)
}

func ShowReport(w http.ResponseWriter, r *http.Request) {
	reportID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	report, err := models.GetByID("report", reportID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, report)
}

func ApproveReport(w http.ResponseWriter, r *http.Request) {
	reportID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	report := &models.Report{ID: reportID}
	err = report.Refresh()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if report.Approved {
		http.Error(w, "report already approved", http.StatusBadRequest)
		return
	}

	report.Approved = true
	err = report.Update()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	notification := &models.Notification{
		UserID:   report.UserID,
		Text:     fmt.Sprintf("Your report has been approved"),
		SenderID: 1,
		Type:     consts.POST,
		LinkID:   report.PostID,
		Date:     time.Now(),
	}

	err = notification.Create()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RespondWithJSON(w, http.StatusOK, report)
}
