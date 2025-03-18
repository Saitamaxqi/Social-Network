package models

import (
	"database/sql"
	"errors"
	"fmt"
	"forum/pkg/consts"
	"forum/pkg/util"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
    ID          int            `json:"id"`
    Username    string         `json:"username"`
    DateOfBirth time.Time      `json:"date_of_birth"`
    Gender      string         `json:"gender"`
    FirstName   string         `json:"first_name"`
    LastName    string         `json:"last_name"`
    Email       string         `json:"email"`
    Password    string         `json:"password"`
    Type        string         `json:"type"`
    Requested   bool           `json:"requested"`
    Avatar      sql.NullString `json:"avatar"`
    ProfileType string         `json:"profile_type"`
    AboutMe     string         `json:"about_me"`
    CreatedAt   time.Time      `json:"created_at"`
    UpdatedAt   time.Time      `json:"updated_at"`
    SessionUUID string         `json:"session_uuid"`
}



func (u *User) CreateTable() error {
    _, err := DB.Exec(`CREATE TABLE IF NOT EXISTS users (
        id                  INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        username            VARCHAR(50) NOT NULL UNIQUE,
        date_of_birth       DATETIME NOT NULL,
        gender              VARCHAR(10) NOT NULL,
        first_name          VARCHAR(50) NOT NULL,
        last_name           VARCHAR(50) NOT NULL,
        email               VARCHAR(50) NOT NULL UNIQUE,
        password            VARCHAR NOT NULL,
        type                VARCHAR NOT NULL,
        requested           BOOLEAN DEFAULT FALSE,
        avatar              VARCHAR(255),
        profile_type        VARCHAR(50) DEFAULT 'public',
        about_me            TEXT,
        created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_email UNIQUE (email)
    )`)
    return err
}


func (u *User) Index() ([]Model, error) {
	rows, err := DB.Query(`SELECT * FROM users WHERE type != ?`, consts.ADMIN)
	if err != nil {
		return nil, err
	}

	var users []Model

	for rows.Next() {
		user := &User{}
		//fix err line below to match the new struct
		err = rows.Scan(&user.ID, &user.Username, &user.DateOfBirth, &user.Gender, &user.FirstName, &user.LastName, &user.Email, &user.Password, &user.Type, &user.Requested, &user.CreatedAt, &user.UpdatedAt)
		if err != nil {
			return nil, err
		}
		user.HideDetails()
		users = append(users, user)
	}

	return users, nil
}
func GetUserByID(id int) (*User, error) {
		user := &User{}
		err := DB.QueryRow(`SELECT * FROM users WHERE id = ?`, id).Scan(&user.ID, &user.Username, &user.DateOfBirth, &user.Gender, &user.FirstName, &user.LastName, &user.Email, &user.Password, &user.Type, &user.Requested, &user.CreatedAt, &user.UpdatedAt)
		if err != nil {
			return nil, err
		}
		return user, nil
}

func (u *User) Create() error {
    if u.Exists() {
        return errors.New("user already exists")
    }

    if !u.ValidType() {
        return errors.New("invalid user type")
    }

    err := u.HashPassword()
    if err != nil {
        return err
    }

    u.Email = strings.ToLower(u.Email)

    result, err := DB.Exec(`INSERT INTO users (username, date_of_birth, gender, first_name, last_name, email, password, type, avatar, profile_type, about_me) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                            u.Username, u.DateOfBirth, u.Gender, u.FirstName, u.LastName, u.Email, u.Password, u.Type, u.Avatar, u.ProfileType, u.AboutMe)
    if err != nil {
        return err
    }

    lastID, err := result.LastInsertId()
    if err != nil {
        return err
    }

    u.ID = int(lastID)
    return nil
}



func (u *User) Update() error {
    if !u.Exists() {
        return errors.New("user does not exist")
    }

    if !u.ValidType() {
        return errors.New("invalid user type")
    }

    err := u.HashPassword()
    if err != nil {
        return err
    }

    u.Email = strings.ToLower(u.Email)

    var id int
    err = DB.QueryRow(`SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?`, u.Username, u.Email, u.ID).Scan(&id)
    if err == nil {
        return errors.New("username or email is already taken")
    }

    _, err = DB.Exec(`UPDATE users SET 
        username = ?, email = ?, password = ?, type = ?, requested = ?, 
        avatar = ?, profile_type = ?, about_me = ?, 
        updated_at = CURRENT_TIMESTAMP WHERE id = ?`, 
        u.Username, u.Email, u.Password, u.Type, u.Requested,
        u.Avatar, u.ProfileType, u.AboutMe, u.ID)

    return err
}


func (u *User) Delete() error {
	if !u.Exists() {
		return errors.New("user does not exist")
	}

	_, err := DB.Exec(`PRAGMA foreign_keys = ON; DELETE FROM users WHERE id = ?`, u.ID)
	return err
}

func (u *User) Refresh() error {
	if !u.Exists() {
		return errors.New("user does not exist")
	}

	err := DB.QueryRow(`SELECT * FROM users WHERE id = ?`, u.ID).Scan(
		&u.ID, &u.Username, &u.DateOfBirth, &u.Gender, &u.FirstName, &u.LastName, 
		&u.Email, &u.Password, &u.Type, &u.Requested,&u.Avatar,&u.ProfileType,&u.AboutMe, &u.CreatedAt, &u.UpdatedAt)	
	if err != nil {
		return errors.New("user does not exist")
	}

	return nil
}

func (u *User) Exists() bool {
	return u.ID != 0
}

func (u *User) HashPassword() error {
	cost, err := bcrypt.Cost([]byte(u.Password))
	if err != nil && !errors.Is(err, bcrypt.ErrHashTooShort) {
		return err
	}

	if cost != bcrypt.DefaultCost {
		password, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		u.Password = string(password)
	}

	return nil
}

func (u *User) ComparePassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

func (u *User) ValidType() bool {
	return u.Type == consts.ADMIN || u.Type == consts.MODERATOR || u.Type == consts.USER
}

func GetUserByNicknameOrEmail(identifier string) (*User, error) {
    user := &User{}
    identifier = strings.TrimSpace(strings.ToLower(identifier))
    err := DB.QueryRow(`SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?`, identifier, identifier).
        Scan(&user.ID, &user.Username, &user.DateOfBirth, &user.Gender, &user.FirstName, &user.LastName, &user.Email, &user.Password, &user.Type, &user.Requested,&user.Avatar,&user.ProfileType,&user.AboutMe, &user.CreatedAt, &user.UpdatedAt)
    return user, err
}


func (u *User) HideDetails() {
	u.Password = ""
	u.SessionUUID = ""
}

// User Sessions

func (u *User) NewSession(duration time.Duration) (*Session, error) {
	if !u.Exists() {
		return nil, errors.New("user does not exist")
	}

	session := &Session{
		UserID: u.ID,
	}

	err := session.Create()
	return session, err
}

func (u *User) Session() (*Session, error) {
	if !u.Exists() {
		return nil, errors.New("user does not exist")
	}

	return GetSessionByUserID(u.ID)
}

// Default_component

func (u *User) Posts() ([]*Post, error) {
	// Use explicit column names instead of * to avoid schema changes breaking the code
	rows, err := DB.Query(`SELECT id, title, body, media, likes, dislikes, post_id, user_id, visibility, group_id, created_at, updated_at FROM posts WHERE user_id = ? AND post_id IS NULL`, u.ID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []*Post

	for rows.Next() {
		post := &Post{}
		err = rows.Scan(&post.ID, &post.Title, &post.Body, &post.Media, &post.Likes, &post.Dislikes, &post.PostID, &post.UserID, &post.Visibility, &post.GroupID, &post.CreatedAt, &post.UpdatedAt)
		if err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}

	return posts, nil
}

func (u *User) Comments() ([]*Post, error) {
	// Use explicit column names instead of * to avoid schema changes breaking the code
	rows, err := DB.Query(`SELECT id, title, body, media, likes, dislikes, post_id, user_id, visibility, group_id, created_at, updated_at FROM posts WHERE user_id = ? AND post_id IS NOT NULL`, u.ID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []*Post

	for rows.Next() {
		post := &Post{}
		err = rows.Scan(&post.ID, &post.Title, &post.Body, &post.Media, &post.Likes, &post.Dislikes, &post.PostID, &post.UserID, &post.Visibility, &post.GroupID, &post.CreatedAt, &post.UpdatedAt)
		if err != nil {
			return nil, err
		}

		err = post.GetOriginalPost()
		if err != nil {
			return nil, err
		}

		posts = append(posts, post)
	}

	return posts, nil
}

func (u *User) LikedPosts() ([]*Post, error) {
	rows, err := DB.Query(`SELECT * FROM post_interactions WHERE user_id = ? AND type = ?`, u.ID, consts.LIKE)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []*Post

	for rows.Next() {
		postInteraction := &PostInteraction{}
		err = rows.Scan(&postInteraction.ID, &postInteraction.UserID, &postInteraction.PostID, &postInteraction.Type)
		if err != nil {
			return nil, err
		}

		post := &Post{
			ID: postInteraction.PostID,
		}
		err = post.Refresh()
		if err != nil {
			return nil, err
		}

		posts = append(posts, post)
	}

	return posts, nil
}

func (u *User) DislikedPosts() ([]*Post, error) {
	rows, err := DB.Query(`SELECT * FROM post_interactions WHERE user_id = ? AND type = ?`, u.ID, consts.DISLIKE)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []*Post

	for rows.Next() {
		postInteraction := &PostInteraction{}
		err = rows.Scan(&postInteraction.ID, &postInteraction.UserID, &postInteraction.PostID, &postInteraction.Type)
		if err != nil {
			return nil, err
		}

		post := &Post{
			ID: postInteraction.PostID,
		}
		err = post.Refresh()
		if err != nil {
			return nil, err
		}

		posts = append(posts, post)
	}

	return posts, nil
}

func (u *User) AllowedToDeletePost(post *Post) bool {
	if post.UserID == u.ID || u.Type == consts.ADMIN {
		return true
	}
	_, err := DB.Exec(`SELECT * FROM reports WHERE post_id = ? AND user_id = ? AND approved = 1`, post.ID, u.ID)
	return err == nil
}

// Report

func (u *User) Reports() ([]*Report, error) {
	rows, err := DB.Query(`SELECT * FROM reports WHERE user_id = ?`, u.ID)
	if err != nil {
		return nil, err
	}

	var reports []*Report

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

func (u *User) DeleteReports() error {
	_, err := DB.Exec(`PRAGMA foreign_keys = ON; DELETE FROM reports WHERE user_id = ?`, u.ID)
	return err
}

// Moderator Requests

func (u *User) ModeratorRequests() ([]*User, error) {
	rows, err := DB.Query(`SELECT * FROM users WHERE requested = ?`, true)
	if err != nil {
		return nil, err
	}

	var users []*User

	for rows.Next() {
		user := &User{}
		err = rows.Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.Type, &user.Requested, &user.CreatedAt, &user.UpdatedAt)
		if err != nil {
			return nil, err
		}
		user.HideDetails()
		users = append(users, user)
	}

	return users, nil
}

// Notifications

func (u *User) Notifications() ([]*Notification, error) {
	rows, err := DB.Query(`SELECT * FROM notifications WHERE user_id = ? ORDER BY date DESC`, u.ID)
	if err != nil {
		return nil, err
	}

	var notifications []*Notification

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

func (u *User) StoreAvatarFile(f multipart.File, h *multipart.FileHeader) error {
    err := u.DeleteAvatarFile()
    if err != nil {
        return err
    }

    name := fmt.Sprintf("avatar_%d_%d%s", u.ID, time.Now().Unix(), filepath.Ext(h.Filename))
    file := util.NewFile(f, h, name)

    err = file.Store()
    if err != nil {
        return err
    }

    u.Avatar = sql.NullString{String: "/" + file.Path, Valid: true}
    err = u.Update()

    return err
}

func (u *User) DeleteAvatarFile() error {
    if !u.Avatar.Valid {
        return nil
    }

    err := util.DeleteFile(u.Avatar.String[1:])

    u.Avatar = sql.NullString{String: "", Valid: false}
    err = u.Update()

    return err
}

// Add method to check profile visibility
func (u *User) IsProfileVisibleTo(viewerID int) (bool, error) {
    // Owner can always see their profile
    if u.ID == viewerID {
        return true, nil
    }
    
    // Public profiles are visible to everyone
    if u.ProfileType == "public" {
        return true, nil
    }
    
    // For private profiles, check if viewer is a follower
    isFollower, err := u.IsFollowedBy(viewerID)
    return isFollower, err
}

func (u *User) IsFollowedBy(userID int) (bool, error) {
    var exists bool
    err := DB.QueryRow(`
        SELECT EXISTS (
            SELECT 1 FROM follows 
            WHERE follower_id = ? AND following_id = ? AND status = 'accepted'
        )`, userID, u.ID).Scan(&exists)
    return exists, err
}

// Add method to get user activity
func (u *User) GetActivity() (map[string]interface{}, error) {
    posts, err := u.Posts()
    if err != nil {
        return nil, err
    }

    followers, err := u.GetFollowers()
    if err != nil {
        return nil, err
    }

    following, err := u.GetFollowing()
    if err != nil {
        return nil, err
    }

    return map[string]interface{}{
        "posts":     posts,
        "followers": followers,
        "following": following,
    }, nil
}

func (u *User) IsCloseFriend(viewerID int) (bool, error) {
	// Make sure the user ID is valid
	if u.ID == 0 {
		return false, nil
	}

	var exists bool
	err := DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM close_friends 
			WHERE user_id = ? AND friend_id = ?
		)`, viewerID, u.ID).Scan(&exists)
	
	if err != nil {
		return false, err
	}
	
	return exists, nil
}
