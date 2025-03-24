package models

import "errors"

type Category struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

func (c *Category) CreateTable() error {
	_, err := DB.Exec(`CREATE TABLE IF NOT EXISTS categories (
			id                 	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
			name           		VARCHAR NOT NULL
	)`)
	return err
}

func (c *Category) Index() ([]Model, error) {
	rows, err := DB.Query(`SELECT * FROM categories`)
	if err != nil {
		return nil, err
	}

	var categories []Model

	for rows.Next() {
		category := &Category{}
		err = rows.Scan(&category.ID, &category.Name)
		if err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}

	return categories, nil
}

func (c *Category) Create() error {
	if c.Exists() {
		return errors.New("category already exists")
	}

	result, err := DB.Exec(`INSERT INTO categories (name) VALUES (?)`, c.Name)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	c.ID = int(id)
	return nil
}

func (c *Category) Update() error {
	if !c.Exists() {
		return errors.New("category does not exist")
	}

	_, err := DB.Exec(`UPDATE categories SET name = ? WHERE id = ?`, c.Name, c.ID)
	return err
}

func (c *Category) Delete() error {
	if !c.Exists() {
		return errors.New("category does not exist")
	}

	_, err := DB.Exec(`PRAGMA foreign_keys = ON; DELETE FROM categories WHERE id = ?`, c.ID)
	if err != nil {
		return err
	}

	_, err = DB.Exec(`PRAGMA foreign_keys = ON; DELETE FROM post_categories WHERE category_id = ?`, c.ID)
	return err
}

func (c *Category) Refresh() error {
	if !c.Exists() {
		return errors.New("category does not exist")
	}

	err := DB.QueryRow(`SELECT * FROM categories WHERE id = ?`, c.ID).Scan(&c.ID, &c.Name)
	if err != nil {
		return errors.New("category does not exist")
	}

	return nil
}

func (c *Category) Exists() bool {
	return c.ID != 0
}
