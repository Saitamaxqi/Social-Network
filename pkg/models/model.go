package models

import (
	"database/sql"
	"errors"
)

var DB *sql.DB

type Model interface {
	CreateTable() error
	Index() ([]Model, error)
	Create() error
	Update() error
	Delete() error
	Refresh() error
	Exists() bool
}

func Index(model string) ([]Model, error) {
	switch model {
	case "user":
		return (&User{}).Index()
	case "post":
		return (&Post{}).Index()
	case "session":
		return (&Session{}).Index()
	default:
		return nil, errors.New("model not found")
	}
}

func GetByID(model string, id int) (Model, error) {
	switch model {
	case "user":
		user := &User{ID: id}
		err := user.Refresh()
		return user, err
	case "post":
		post := &Post{ID: id}
		err := post.Refresh()
		return post, err
	case "category":
		category := &Category{ID: id}
		err := category.Refresh()
		return category, err
	case "report":
		report := &Report{ID: id}
		err := report.Refresh()
		return report, err
	case "notification":
		notification := &Notification{ID: id}
		err := notification.Refresh()
		return notification, err
	default:
		return nil, errors.New("model not found")
	}
}
