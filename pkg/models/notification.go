package models

import (
	"errors"
	"time"
)

type Notification struct {
	ID       int       `json:"id"`
	UserID   int       `json:"user_id"`
	Text     string    `json:"text"`
	Seen     bool      `json:"seen"`
	SenderID int       `json:"sender_id"`
	Type     string    `json:"type"`
	LinkID   int       `json:"link_id"`
	Date     time.Time `json:"date"`
}

func (n *Notification) CreateTable() error {
	_, err := DB.Exec(`CREATE TABLE IF NOT EXISTS notifications (
			id                 	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
			user_id           	INTEGER NOT NULL,
			text           		TEXT NOT NULL,
			seen           		BOOLEAN DEFAULT FALSE,
			sender_id           INTEGER NOT NULL,
			type           		TEXT NOT NULL,
			link_id           	INTEGER NOT NULL,
			date           		DATETIME DEFAULT CURRENT_TIMESTAMP
	)`)
	return err
}

func (n *Notification) Index() ([]Model, error) {
	rows, err := DB.Query(`SELECT * FROM notifications WHERE user_id = ?`, n.UserID)
	if err != nil {
		return nil, err
	}

	var notifications []Model

	for rows.Next() {
		notification := &Notification{}
		err = rows.Scan(&notification.ID, &notification.UserID, &notification.Text, &notification.Seen, &notification.SenderID, &notification.Type, &notification.LinkID, &notification.Date)
		if err != nil {
			return nil, err
		}
		notifications = append(notifications, notification)
	}

	return notifications, nil
}

func (n *Notification) Create() error {
	result, err := DB.Exec(`INSERT INTO notifications (user_id, text, sender_id, type, link_id, date) VALUES (?, ?, ?, ?, ?, ?)`, n.UserID, n.Text, n.SenderID, n.Type, n.LinkID, n.Date)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	n.ID = int(id)

	return nil
}

func (n *Notification) Update() error {
	_, err := DB.Exec(`UPDATE notifications SET seen = ? WHERE id = ?`, n.Seen, n.ID)
	return err
}

func (n *Notification) Delete() error {
	_, err := DB.Exec(`PRAGMA foreign_keys = ON; DELETE FROM notifications WHERE id = ?`, n.ID)
	return err
}

func (n *Notification) Refresh() error {
	err := DB.QueryRow(`SELECT * FROM notifications WHERE id = ?`, n.ID).Scan(&n.ID, &n.UserID, &n.Text, &n.Seen, &n.SenderID, &n.Type, &n.LinkID, &n.Date)
	if err != nil {
		return errors.New("notification does not exist")
	}
	return nil
}

func (n *Notification) Exists() bool {
	return n.ID != 0
}
