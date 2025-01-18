package models

import "errors"

type PostCategory struct {
	ID         int `json:"id"`
	PostID     int `json:"post_id"`
	CategoryID int `json:"category_id"`
}

func (pc *PostCategory) CreateTable() error {
	_, err := DB.Exec(`CREATE TABLE IF NOT EXISTS post_categories (
			id                 	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
			post_id           	INTEGER NOT NULL,
			category_id         INTEGER NOT NULL,
			FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
			FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
	)`)
	return err
}

func (pc *PostCategory) Index() ([]Model, error) {
	rows, err := DB.Query(`SELECT * FROM post_categories WHERE post_id = ? OR category_id = ?`, pc.PostID, pc.CategoryID)
	if err != nil {
		return nil, err
	}

	var postCategories []Model

	for rows.Next() {
		postCategory := &PostCategory{}
		err = rows.Scan(&postCategory.ID, &postCategory.PostID, &postCategory.CategoryID)
		if err != nil {
			return nil, err
		}
		postCategories = append(postCategories, postCategory)
	}

	return postCategories, nil
}

func (pc *PostCategory) Create() error {
	if pc.Exists() {
		return errors.New("post category already exists")
	}

	result, err := DB.Exec(`INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)`, pc.PostID, pc.CategoryID)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	pc.ID = int(id)
	return nil
}

func (pc *PostCategory) Update() error {
	if !pc.Exists() {
		return errors.New("post category does not exist")
	}

	_, err := DB.Exec(`UPDATE post_categories SET post_id = ?, category_id = ? WHERE id = ?`, pc.PostID, pc.CategoryID, pc.ID)
	return err
}

func (pc *PostCategory) Delete() error {
	if !pc.Exists() {
		return errors.New("post category does not exist")
	}

	_, err := DB.Exec(`PRAGMA foreign_keys = ON; DELETE FROM post_categories WHERE id = ?`, pc.ID)
	return err
}

func (pc *PostCategory) Refresh() error {
	if !pc.Exists() {
		return errors.New("post category does not exist")
	}

	err := DB.QueryRow(`SELECT * FROM post_categories WHERE id = ?`, pc.ID).Scan(&pc.ID, &pc.PostID, &pc.CategoryID)
	if err != nil {
		return errors.New("post category does not exist")
	}

	return nil
}

func (pc *PostCategory) Exists() bool {
	return pc.ID != 0
}

func (p *Post) SyncCategories(categories []int) error {
	DB.Exec(`PRAGMA foreign_keys = ON; DELETE FROM post_categories WHERE post_id = ?`, p.ID)

	for _, categoryID := range categories {
		_, err := GetByID("category", categoryID)
		if err != nil {
			continue
		}
		postCategory := &PostCategory{
			PostID:     p.ID,
			CategoryID: categoryID,
		}
		err = postCategory.Create()
		if err != nil {
			return err
		}
	}

	return nil
}
