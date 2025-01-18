package models

import (
	"errors"
	"github.com/gofrs/uuid"
	"time"
)

type Session struct {
	UUID   string `json:"uuid"`
	UserID int    `json:"user_id"`

	LastActive time.Time `json:"last_active"`
	ExpiresAt  time.Time `json:"expires_at"`
}

func (s *Session) CreateTable() error {
	_, err := DB.Exec(`CREATE TABLE IF NOT EXISTS sessions (
			uuid            VARCHAR NOT NULL PRIMARY KEY,
			user_id         INTEGER NOT NULL,
			last_active		DATETIME DEFAULT CURRENT_TIMESTAMP,
			expires_at      DATETIME NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`)
	return err
}

func (s *Session) Index() ([]Model, error) {
	rows, err := DB.Query(`SELECT * FROM sessions`)
	if err != nil {
		return nil, err
	}

	var sessions []Model

	for rows.Next() {
		session := &Session{}
		err = rows.Scan(&session.UUID, &session.UserID, &session.LastActive, &session.ExpiresAt)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, session)
	}

	return sessions, nil
}

func (s *Session) Create() error {
	id, err := uuid.NewV4()
	if err != nil {
		return err
	}
	s.UUID = id.String()

	_, err = DB.Exec(`INSERT INTO sessions (uuid, user_id, expires_at) VALUES (?, ?, ?)`, s.UUID, s.UserID, s.ExpiresAt)
	return err
}

func (s *Session) Update() error {
	if !s.Exists() {
		return errors.New("session does not exist")
	}

	_, err := DB.Exec(`UPDATE sessions SET user_id = ?, last_active = ?, expires_at = ? WHERE uuid = ?`, s.UserID, s.LastActive, s.ExpiresAt, s.UUID)
	return err
}

func (s *Session) Delete() error {
	if !s.Exists() {
		return errors.New("session does not exist")
	}

	_, err := DB.Exec(`PRAGMA foreign_keys = ON; DELETE FROM sessions WHERE uuid = ?`, s.UUID)
	return err
}

func (s *Session) Refresh() error {
	if !s.Exists() {
		return errors.New("session does not exist")
	}

	err := DB.QueryRow(`SELECT * FROM sessions WHERE uuid = ?`, s.UUID).Scan(&s.UUID, &s.UserID, &s.LastActive, &s.ExpiresAt)
	if err != nil {
		return errors.New("session does not exist")
	}

	return nil
}

func (s *Session) Exists() bool {
	return s.UUID != "" || s.UserID != 0
}

func (s *Session) Expired() bool {
	return time.Now().After(s.ExpiresAt)
}

func (s *Session) Idle() bool {
	return time.Now().After(s.LastActive.Add(time.Minute * 15))
}

func GetSessionByUUID(uuid string) (*Session, error) {
	session := &Session{UUID: uuid}
	err := session.Refresh()
	return session, err
}

func GetSessionByUserID(userID int) (*Session, error) {
	row := DB.QueryRow(`SELECT * FROM sessions WHERE user_id = ?`, userID)

	session := &Session{}
	err := row.Scan(&session.UUID, &session.UserID, &session.LastActive, &session.ExpiresAt)
	return session, err
}

// Session User

func (s *Session) User() (*User, error) {
	user := &User{ID: s.UserID}
	err := user.Refresh()
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *Session) Type() (string, error) {
	user, err := s.User()
	if err != nil {
		return "", err
	}

	return user.Type, nil
}
