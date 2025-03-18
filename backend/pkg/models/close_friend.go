package models

import (
	"errors"
)

type CloseFriend struct {
	ID       int  `json:"id"`
	UserID   int  `json:"user_id"`
	FriendID int  `json:"friend_id"`
	Friend   *User `json:"friend"`
}

func (cf *CloseFriend) CreateTable() error {
	_, err := DB.Exec(`CREATE TABLE IF NOT EXISTS close_friends (
		id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		friend_id INTEGER NOT NULL,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
		UNIQUE(user_id, friend_id)
	)`)
	return err
}

func (cf *CloseFriend) Create() error {
	if cf.ID != 0 {
		return errors.New("close friend relation already exists")
	}

	result, err := DB.Exec(`INSERT INTO close_friends (user_id, friend_id) VALUES (?, ?)`, 
		cf.UserID, cf.FriendID)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	cf.ID = int(id)
	return nil
}

func (cf *CloseFriend) Delete() error {
	if cf.ID == 0 && (cf.UserID == 0 || cf.FriendID == 0) {
		return errors.New("close friend relation not specified")
	}

	var err error
	if cf.ID != 0 {
		_, err = DB.Exec(`DELETE FROM close_friends WHERE id = ?`, cf.ID)
	} else {
		_, err = DB.Exec(`DELETE FROM close_friends WHERE user_id = ? AND friend_id = ?`, 
			cf.UserID, cf.FriendID)
	}
	return err
}

func (cf *CloseFriend) GetByUser(userID int) ([]*CloseFriend, error) {
	rows, err := DB.Query(`
		SELECT cf.id, cf.user_id, cf.friend_id, 
			u.id, u.username, u.email, u.created_at, u.updated_at
		FROM close_friends cf
		JOIN users u ON cf.friend_id = u.id
		WHERE cf.user_id = ?
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var closeFriends []*CloseFriend
	for rows.Next() {
		friend := &CloseFriend{
			Friend: &User{},
		}
		err = rows.Scan(
			&friend.ID, &friend.UserID, &friend.FriendID,
			&friend.Friend.ID, &friend.Friend.Username, &friend.Friend.Email,
			&friend.Friend.CreatedAt, &friend.Friend.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		closeFriends = append(closeFriends, friend)
	}

	return closeFriends, nil
}

// Refresh loads the close friend relationship from the database
func (cf *CloseFriend) Refresh() error {
	if cf.ID == 0 && (cf.UserID == 0 || cf.FriendID == 0) {
		return errors.New("close friend relation not specified")
	}

	var query string
	var args []interface{}

	if cf.ID != 0 {
		query = `SELECT id, user_id, friend_id FROM close_friends WHERE id = ?`
		args = []interface{}{cf.ID}
	} else {
		query = `SELECT id, user_id, friend_id FROM close_friends WHERE user_id = ? AND friend_id = ?`
		args = []interface{}{cf.UserID, cf.FriendID}
	}

	err := DB.QueryRow(query, args...).Scan(&cf.ID, &cf.UserID, &cf.FriendID)
	return err
}

// Update updates the close friend relationship in the database
func (cf *CloseFriend) Update() error {
	// Since close_friends table only has ID, user_id, and friend_id,
	// and these shouldn't change, this method doesn't need to do anything
	return nil
}

// Index returns all close friend relationships
func (cf *CloseFriend) Index() ([]Model, error) {
	rows, err := DB.Query(`SELECT id, user_id, friend_id FROM close_friends`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var closeFriends []Model
	for rows.Next() {
		friend := &CloseFriend{}
		err = rows.Scan(&friend.ID, &friend.UserID, &friend.FriendID)
		if err != nil {
			return nil, err
		}
		closeFriends = append(closeFriends, friend)
	}

	return closeFriends, nil
}

// Exists checks if the close friend relationship exists in the database
func (cf *CloseFriend) Exists() bool {
	if cf.ID == 0 && (cf.UserID == 0 || cf.FriendID == 0) {
		return false
	}

	var exists bool
	var query string
	var args []interface{}

	if cf.ID != 0 {
		query = `SELECT EXISTS(SELECT 1 FROM close_friends WHERE id = ?)`
		args = []interface{}{cf.ID}
	} else {
		query = `SELECT EXISTS(SELECT 1 FROM close_friends WHERE user_id = ? AND friend_id = ?)`
		args = []interface{}{cf.UserID, cf.FriendID}
	}

	_ = DB.QueryRow(query, args...).Scan(&exists)
	return exists
}
