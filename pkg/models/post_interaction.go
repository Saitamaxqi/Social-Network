package models

import (
	"errors"
	"forum/pkg/consts"
)

type PostInteraction struct {
	ID     int `json:"id"`
	UserID int `json:"user_id"`
	PostID int `json:"post_id"`
	Type   int `json:"type"`
}

func (pi *PostInteraction) CreateTable() error {
	_, err := DB.Exec(`CREATE TABLE IF NOT EXISTS post_interactions (
			id                 	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
			user_id           	INTEGER NOT NULL,
			post_id           	INTEGER NOT NULL,
			type           		INTEGER NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
	)`)
	return err
}

func (pi *PostInteraction) Index() ([]Model, error) {
	rows, err := DB.Query(`SELECT * FROM post_interactions WHERE post_id = ? OR user_id = ?`, pi.PostID, pi.UserID)
	if err != nil {
		return nil, err
	}

	var postInteractions []Model

	for rows.Next() {
		postInteraction := &PostInteraction{}
		err = rows.Scan(&postInteraction.ID, &postInteraction.UserID, &postInteraction.PostID, &postInteraction.Type)
		if err != nil {
			return nil, err
		}
		postInteractions = append(postInteractions, postInteraction)
	}

	return postInteractions, nil
}

func (pi *PostInteraction) Create() error {
	if pi.Exists() {
		return errors.New("post interaction already exists")
	}

	result, err := DB.Exec(`INSERT INTO post_interactions (user_id, post_id, type) VALUES (?, ?, ?)`, pi.UserID, pi.PostID, pi.Type)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	pi.ID = int(id)

	if pi.Type == consts.LIKE {
		_, err = DB.Exec(`UPDATE posts SET likes = likes + 1 WHERE id = ?`, pi.PostID)
	} else if pi.Type == consts.DISLIKE {
		_, err = DB.Exec(`UPDATE posts SET dislikes = dislikes + 1 WHERE id = ?`, pi.PostID)
	}
	return err
}

func (pi *PostInteraction) Update() error {
	if !pi.Exists() {
		return errors.New("post interaction does not exist")
	}

	_, err := DB.Exec(`UPDATE post_interactions SET type = ? WHERE id = ?`, pi.Type, pi.ID)
	if err != nil {
		return err
	}
	if pi.Type == consts.LIKE {
		_, err = DB.Exec(`UPDATE posts SET likes = likes + 1 WHERE id = ?`, pi.PostID)
		_, err = DB.Exec(`UPDATE posts SET dislikes = dislikes - 1 WHERE id = ?`, pi.PostID)
	} else if pi.Type == consts.DISLIKE {
		_, err = DB.Exec(`UPDATE posts SET dislikes = dislikes + 1 WHERE id = ?`, pi.PostID)
		_, err = DB.Exec(`UPDATE posts SET likes = likes - 1 WHERE id = ?`, pi.PostID)
	}
	return err
}

func (pi *PostInteraction) Refresh() error {
	if !pi.Exists() {
		return errors.New("post interaction does not exist")
	}

	err := DB.QueryRow(`SELECT * FROM post_interactions WHERE user_id = ? AND post_id = ?`, pi.UserID, pi.PostID).Scan(&pi.ID, &pi.UserID, &pi.PostID, &pi.Type)
	if err != nil {
		return errors.New("post interaction does not exist")
	}

	return nil
}

func (pi *PostInteraction) Delete() error {
	if !pi.Exists() {
		return errors.New("post interaction does not exist")
	}

	_, err := DB.Exec(`PRAGMA foreign_keys = ON; DELETE FROM post_interactions WHERE id = ?`, pi.ID)
	if err != nil {
		return err
	}
	if pi.Type == consts.LIKE {
		_, err = DB.Exec(`UPDATE posts SET likes = likes - 1 WHERE id = ?`, pi.PostID)
	} else if pi.Type == consts.DISLIKE {
		_, err = DB.Exec(`UPDATE posts SET dislikes = dislikes - 1 WHERE id = ?`, pi.PostID)

	}
	return err
}

func (pi *PostInteraction) Exists() bool {
	return pi.ID != 0
}

func (u *User) LikePost(postID int) (int, error) {
	var pi PostInteraction
	err := DB.QueryRow(`SELECT * FROM post_interactions WHERE user_id = ? AND post_id = ?`, u.ID, postID).Scan(&pi.ID, &pi.UserID, &pi.PostID, &pi.Type)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			pi = PostInteraction{
				UserID: u.ID,
				PostID: postID,
				Type:   consts.LIKE,
			}
			return consts.LIKE, pi.Create()
		}
		return consts.NONE, err
	}

	if pi.Type == consts.LIKE {
		return consts.NONE, pi.Delete()
	}

	pi.Type = consts.LIKE

	return pi.Type, pi.Update()
}

func (u *User) DislikePost(postID int) (int, error) {
	var pi PostInteraction
	err := DB.QueryRow(`SELECT * FROM post_interactions WHERE user_id = ? AND post_id = ?`, u.ID, postID).Scan(&pi.ID, &pi.UserID, &pi.PostID, &pi.Type)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			pi = PostInteraction{
				UserID: u.ID,
				PostID: postID,
				Type:   consts.DISLIKE,
			}
			return consts.DISLIKE, pi.Create()
		}
		return consts.NONE, err
	}

	if pi.Type == consts.DISLIKE {
		return consts.NONE, pi.Delete()
	}

	pi.Type = consts.DISLIKE
	return pi.Type, pi.Update()
}
