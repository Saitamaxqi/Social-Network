package models

import "errors"

type Report struct {
	ID       int    `json:"id"`
	Content  string `json:"content"`
	Type     string `json:"type"`
	Approved bool   `json:"approved"`
	PostID   int    `json:"post_id"`
	UserID   int    `json:"user_id"`

	Post *Post `json:"post"`
	User *User `json:"user"`
}

func (r *Report) CreateTable() error {
	_, err := DB.Exec(`CREATE TABLE IF NOT EXISTS reports (
			id                 	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
			content           	VARCHAR NOT NULL,
			type                VARCHAR NOT NULL,
			approved            BOOLEAN DEFAULT FALSE,
			post_id             INTEGER NOT NULL,
			user_id             INTEGER NOT NULL,
			FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	)`)
	return err
}

func (r *Report) Index() ([]Model, error) {
	rows, err := DB.Query(`SELECT * FROM reports`)
	if err != nil {
		return nil, err
	}

	var reports []Model

	for rows.Next() {
		report := &Report{}
		err = rows.Scan(&report.ID, &report.Content, &report.Type, &report.Approved, &report.PostID, &report.UserID)
		if err != nil {
			return nil, err
		}

		err = report.GetRelations()
		if err != nil {
			return nil, err
		}

		reports = append(reports, report)
	}

	return reports, nil
}

func (r *Report) Create() error {
	if r.Exists() {
		return errors.New("report already exists")
	}

	result, err := DB.Exec(`INSERT INTO reports (content, type, approved, post_id, user_id) VALUES (?, ?, ?, ?, ?)`, r.Content, r.Type, r.Approved, r.PostID, r.UserID)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	r.ID = int(id)

	return nil
}

func (r *Report) Update() error {
	if !r.Exists() {
		return errors.New("report does not exist")
	}

	_, err := DB.Exec(`UPDATE reports SET content = ?, type = ?, approved = ?, post_id = ?, user_id = ? WHERE id = ?`, r.Content, r.Type, r.Approved, r.PostID, r.UserID, r.ID)
	return err
}

func (r *Report) Delete() error {
	if !r.Exists() {
		return errors.New("report does not exist")
	}

	_, err := DB.Exec(`PRAGMA foreign_keys = ON; DELETE FROM reports WHERE id = ?`, r.ID)
	return err
}

func (r *Report) Refresh() error {
	if !r.Exists() {
		return errors.New("report does not exist")
	}

	err := DB.QueryRow(`SELECT * FROM reports WHERE id = ?`, r.ID).Scan(&r.ID, &r.Content, &r.Type, &r.Approved, &r.PostID, &r.UserID)
	if err != nil {
		return errors.New("report does not exist")
	}

	return nil
}

func (r *Report) Exists() bool {
	return r.ID != 0
}

func (r *Report) Reported(user *User) bool {
	err := DB.QueryRow(`SELECT * FROM reports WHERE post_id = ? AND user_id = ?`, r.PostID, user.ID).Scan(&r.ID, &r.Content, &r.Type, &r.Approved, &r.PostID, &r.UserID)
	return err == nil
}

func (r *Report) GetUser() error {
	user := &User{ID: r.UserID}
	err := user.Refresh()
	if err != nil {
		return err
	}
	r.User = user
	return nil
}

func (r *Report) GetPost() error {
	post := &Post{ID: r.PostID}
	err := post.Refresh()
	if err != nil {
		return err
	}
	r.Post = post
	return nil
}

func (r *Report) GetRelations() error {
	err := r.GetPost()
	if err != nil {
		return err
	}
	err = r.GetUser()
	if err != nil {
		return err
	}
	return nil
}
