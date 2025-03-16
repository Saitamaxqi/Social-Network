package models

import (
	"database/sql"
	"errors"
	"fmt"
	"forum/pkg/util"
	"mime/multipart"
	"path/filepath"
	"time"
)

type Post struct {
	ID         int            `json:"id"`
	Title      string         `json:"title"`
	Body       string         `json:"body"`
	Media      sql.NullString `json:"media"`
	Likes      int            `json:"likes"`
	Dislikes   int            `json:"dislikes"`
	PostID     sql.NullInt64  `json:"post_id"`
	UserID     int            `json:"user_id"`
	Visibility string         `json:"visibility"`
	GroupID    sql.NullInt64  `json:"group_id"` // ID of the group if this is a group post

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	OriginalPost *Post       `json:"original_post"`
	Comments     []*Post     `json:"comments"`
	Categories   []*Category `json:"categories"`
	User         *User       `json:"user"`
	Interaction  int         `json:"interaction"`
	Group        *Group      `json:"group,omitempty"` // Group information if this is a group post
}

func (p *Post) CreateTable() error {
	_, err := DB.Exec(`CREATE TABLE IF NOT EXISTS posts (
    			id                 	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,	
    			title           	VARCHAR(50) NULL,
    			body           		VARCHAR NOT NULL,
    			media           	VARCHAR NULL,
    			likes           	INTEGER DEFAULT 0,
    			dislikes           	INTEGER DEFAULT 0,
    			post_id           	INTEGER NULL,
    			user_id           	INTEGER NOT NULL,
    			visibility       	VARCHAR NULL,
    			group_id           	INTEGER NULL,
    			created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
    			updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
    			FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
	)`)
	return err
}

func (p *Post) Index() ([]Model, error) {
	rows, err := DB.Query(`SELECT * FROM posts WHERE post_id IS NULL ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}

	var posts []Model

	for rows.Next() {
		post := &Post{}
		err = rows.Scan(&post.ID, &post.Title, &post.Body, &post.Media, &post.Likes, &post.Dislikes, &post.PostID, &post.UserID, &post.Visibility, &post.GroupID, &post.CreatedAt, &post.UpdatedAt)
		if err != nil {
			return nil, err
		}

		err = post.GetUser()
		if err != nil {
			return nil, err
		}

		err = post.GetCategories()
		if err != nil {
			return nil, err
		}

		posts = append(posts, post)
	}

	return posts, nil
}

func (p *Post) Create() error {
	if p.Exists() {
		return errors.New("post already exists")
	}

	result, err := DB.Exec(`INSERT INTO posts (title, body, media, post_id, user_id, visibility, group_id) VALUES (?, ?, ?, ?, ?, ?, ?)`, p.Title, p.Body, p.Media, p.PostID, p.UserID, p.Visibility, p.GroupID)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	p.ID = int(id)

	return nil
}

func (p *Post) Update() error {
	if !p.Exists() {
		return errors.New("post does not exist")
	}

	_, err := DB.Exec(`UPDATE posts SET title = ?, body = ?, media = ?, likes = ?, dislikes = ?, post_id = ?, user_id = ?, visibility = ?, group_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, p.Title, p.Body, p.Media, p.Likes, p.Dislikes, p.PostID, p.UserID, p.Visibility, p.GroupID, p.ID)
	return err
}

func (p *Post) Delete() error {
	if !p.Exists() {
		return errors.New("post does not exist")
	}

	err := p.DeleteMediaFile()
	if err != nil {
		return err
	}

	_, err = DB.Exec(`PRAGMA foreign_keys = ON; DELETE FROM posts WHERE id = ?`, p.ID)
	return err
}

func (p *Post) Refresh() error {
	if !p.Exists() {
		return errors.New("post does not exist")
	}

	err := DB.QueryRow(`SELECT * FROM posts WHERE id = ?`, p.ID).Scan(&p.ID, &p.Title, &p.Body, &p.Media, &p.Likes, &p.Dislikes, &p.PostID, &p.UserID, &p.Visibility, &p.GroupID, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return errors.New("post does not exist")
	}

	return nil
}

func (p *Post) Exists() bool {
	return p.ID != 0
}

func (p *Post) StoreMediaFile(f multipart.File, h *multipart.FileHeader) error {
	err := p.DeleteMediaFile()
	if err != nil {
		return err
	}

	name := fmt.Sprintf("%d_%d%s", p.ID, time.Now().Unix(), filepath.Ext(h.Filename))
	file := util.NewFile(f, h, name)

	err = file.Store()
	if err != nil {
		return err
	}

	p.Media = sql.NullString{String: "/" + file.Path, Valid: true}
	err = p.Update()

	return err
}

func (p *Post) DeleteMediaFile() error {
	if !p.Media.Valid {
		return nil
	}

	err := util.DeleteFile(p.Media.String[1:])

	p.Media = sql.NullString{String: "", Valid: false}
	err = p.Update()

	return err
}

func (p *Post) GetComments() error {
	rows, err := DB.Query(`SELECT * FROM posts WHERE post_id = ?`, p.ID)
	if err != nil {
		return err
	}

	var comments []*Post

	for rows.Next() {
		comment := &Post{}
		err = rows.Scan(&comment.ID, &comment.Title, &comment.Body, &comment.Media, &comment.Likes, &comment.Dislikes, &comment.PostID, &comment.UserID, &comment.Visibility, &comment.GroupID, &comment.CreatedAt, &comment.UpdatedAt)
		if err != nil {
			return err
		}
		comments = append(comments, comment)
	}

	p.Comments = comments

	for _, comment := range p.Comments {
		err = comment.GetComments()
		if err != nil {
			return err
		}
		err = comment.GetUser()
		if err != nil {
			return err
		}
	}

	return nil
}

func (p *Post) GetCategories() error {
	rows, err := DB.Query(`SELECT * FROM post_categories WHERE post_id = ?`, p.ID)
	if err != nil {
		return err
	}

	var categories []*Category

	for rows.Next() {
		postCategory := &PostCategory{}
		err = rows.Scan(&postCategory.ID, &postCategory.PostID, &postCategory.CategoryID)
		if err != nil {
			return err
		}
		category := &Category{ID: postCategory.CategoryID}
		err = category.Refresh()
		if err != nil {
			return err
		}
		categories = append(categories, category)
	}

	p.Categories = categories

	return nil
}

func (p *Post) GetUser() error {
	user := &User{ID: p.UserID}
	err := user.Refresh()
	if err != nil {
		return err
	}

	user.Email = ""
	user.Password = ""

	p.User = user

	return nil
}

func (p *Post) GetOriginalPost() error {
	if !p.PostID.Valid {
		return nil
	}

	post := &Post{ID: int(p.PostID.Int64)}
	err := post.Refresh()
	if err != nil {
		return err
	}

	err = post.GetUser()
	if err != nil {
		return err
	}

	p.OriginalPost = post

	return nil
}

func (p *Post) GetInteraction(userID int) {
	var interaction int
	err := DB.QueryRow(`SELECT type FROM post_interactions WHERE post_id = ? AND user_id = ?`, p.ID, userID).Scan(&interaction)

	if err != nil {
		interaction = 0
	}
	p.Interaction = interaction

	for _, comment := range p.Comments {
		comment.GetInteraction(userID)
	}
}

func (p *Post) GetRelations() error {
	err := p.GetComments()
	if err != nil {
		return err
	}
	err = p.GetCategories()
	if err != nil {
		return err
	}
	err = p.GetUser()
	if err != nil {
		return err
	}

	// Load original post if this is a comment
	if p.PostID.Valid {
		err = p.GetOriginalPost()
		if err != nil {
			return err
		}
	}

	// Load group if this is a group post
	if p.GroupID.Valid {
		err = p.GetGroup()
		if err != nil {
			return err
		}
	}

	return nil
}

// GetGroup loads the group information for a post if it's a group post
func (p *Post) GetGroup() error {
	if !p.GroupID.Valid {
		return nil
	}

	group := &Group{ID: int(p.GroupID.Int64)}
	err := group.Refresh()
	if err != nil {
		return err
	}

	p.Group = group

	return nil
}

// GetGroupPosts retrieves all posts for a specific group
func GetGroupPosts(groupID, userID int) ([]*Post, error) {
	var posts []*Post

	rows, err := DB.Query(`
		SELECT id FROM posts 
		WHERE group_id = ? 
		ORDER BY created_at DESC
	`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}

		post := &Post{ID: id}
		if err := post.Refresh(); err != nil {
			return nil, err
		}

		// Load relations for each post
		if err := post.GetRelations(); err != nil {
			return nil, err
		}

		// Get user interaction with this post
		post.GetInteraction(userID)

		posts = append(posts, post)
	}

	return posts, nil
}
