package models

import (
	"database/sql"
	"time"
)

type Group struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	CreatorID   int       `json:"creator_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Creator *User `json:"creator,omitempty"`
	Members []*GroupMember `json:"members,omitempty"`
}

type GroupMember struct {
	ID        int       `json:"id"`
	GroupID   int       `json:"group_id"`
	UserID    int       `json:"user_id"`
	Status    string    `json:"status"` // "pending", "member", "requested"
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	User  *User  `json:"user,omitempty"`
	Group *Group `json:"group,omitempty"`
}

type GroupPost struct {
	ID        int            `json:"id"`
	GroupID   int            `json:"group_id"`
	UserID    int            `json:"user_id"`
	Title     string         `json:"title"`
	Content   string         `json:"content"`
	Media     sql.NullString `json:"media"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`

	User    *User         `json:"user,omitempty"`
	Group   *Group        `json:"group,omitempty"`
	Comments []*GroupPost `json:"comments,omitempty"`
}

type GroupMessage struct {
	ID        int       `json:"id"`
	GroupID   int       `json:"group_id"`
	SenderID  int       `json:"sender_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`

	Sender *User  `json:"sender,omitempty"`
	Group  *Group `json:"group,omitempty"`
}

type GroupEvent struct {
	ID          int       `json:"id"`
	GroupID     int       `json:"group_id"`
	CreatorID   int       `json:"creator_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	DateTime    time.Time `json:"date_time"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Creator *User `json:"creator,omitempty"`
	Group   *Group `json:"group,omitempty"`
	Responses []*GroupEventResponse `json:"responses,omitempty"`
}

type GroupEventResponse struct {
	ID        int       `json:"id"`
	EventID   int       `json:"event_id"`
	UserID    int       `json:"user_id"`
	Response  string    `json:"response"` // "going", "not_going"
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	User  *User       `json:"user,omitempty"`
	Event *GroupEvent `json:"event,omitempty"`
}

func (g *Group) CreateTable() error {
	query := `CREATE TABLE IF NOT EXISTS groups (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		description TEXT,
		creator_id INTEGER NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
	)`
	_, err := DB.Exec(query)
	return err
}

func (gm *GroupMember) CreateTable() error {
	query := `CREATE TABLE IF NOT EXISTS group_members (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		group_id INTEGER NOT NULL,
		user_id INTEGER NOT NULL,
		status TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	)`
	_, err := DB.Exec(query)
	return err
}

func (gp *GroupPost) CreateTable() error {
	query := `CREATE TABLE IF NOT EXISTS group_posts (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		group_id INTEGER NOT NULL,
		user_id INTEGER NOT NULL,
		title TEXT NOT NULL,
		content TEXT,
		media TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	)`
	_, err := DB.Exec(query)
	return err
}

func (ge *GroupEvent) CreateTable() error {
	query := `CREATE TABLE IF NOT EXISTS group_events (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		group_id INTEGER NOT NULL,
		creator_id INTEGER NOT NULL,
		title TEXT NOT NULL,
		description TEXT,
		date_time DATETIME NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
		FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
	)`
	_, err := DB.Exec(query)
	return err
}

func (ger *GroupEventResponse) CreateTable() error {
	query := `CREATE TABLE IF NOT EXISTS group_event_responses (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		event_id INTEGER NOT NULL,
		user_id INTEGER NOT NULL,
		response TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (event_id) REFERENCES group_events(id) ON DELETE CASCADE,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	)`
	_, err := DB.Exec(query)
	return err
}

// Implement Model interface methods for each struct
func (g *Group) Index() ([]Model, error) {
	var groups []Model
	rows, err := DB.Query("SELECT id, title, description, creator_id, created_at, updated_at FROM groups")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var group Group
		err = rows.Scan(&group.ID, &group.Title, &group.Description, &group.CreatorID, &group.CreatedAt, &group.UpdatedAt)
		if err != nil {
			return nil, err
		}
		groups = append(groups, &group)
	}
	return groups, nil
}

func (g *Group) Create() error {
	query := `INSERT INTO groups (title, description, creator_id) VALUES (?, ?, ?)`
	result, err := DB.Exec(query, g.Title, g.Description, g.CreatorID)
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	g.ID = int(id)
	return nil
}

func (g *Group) Update() error {
	query := `UPDATE groups SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
	_, err := DB.Exec(query, g.Title, g.Description, g.ID)
	return err
}

func (g *Group) Delete() error {
	query := `DELETE FROM groups WHERE id = ?`
	_, err := DB.Exec(query, g.ID)
	return err
}

func (g *Group) Refresh() error {
	query := `SELECT id, title, description, creator_id, created_at, updated_at FROM groups WHERE id = ?`
	return DB.QueryRow(query, g.ID).Scan(&g.ID, &g.Title, &g.Description, &g.CreatorID, &g.CreatedAt, &g.UpdatedAt)
}

func (g *Group) Exists() bool {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM groups WHERE id = ?)`
	DB.QueryRow(query, g.ID).Scan(&exists)
	return exists
}

// GroupMember CRUD methods
func (gm *GroupMember) Index() ([]Model, error) {
	var members []Model
	rows, err := DB.Query(`SELECT id, group_id, user_id, status, created_at, updated_at 
		FROM group_members`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var member GroupMember
		err = rows.Scan(&member.ID, &member.GroupID, &member.UserID, &member.Status, 
			&member.CreatedAt, &member.UpdatedAt)
		if err != nil {
			return nil, err
		}
		members = append(members, &member)
	}
	return members, nil
}

func (gm *GroupMember) Create() error {
	query := `INSERT INTO group_members (group_id, user_id, status) VALUES (?, ?, ?)`
	result, err := DB.Exec(query, gm.GroupID, gm.UserID, gm.Status)
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	gm.ID = int(id)
	return nil
}

func (gm *GroupMember) Update() error {
	query := `UPDATE group_members SET status = ?, updated_at = CURRENT_TIMESTAMP 
		WHERE id = ?`
	_, err := DB.Exec(query, gm.Status, gm.ID)
	return err
}

func (gm *GroupMember) Delete() error {
	query := `DELETE FROM group_members WHERE id = ?`
	_, err := DB.Exec(query, gm.ID)
	return err
}

func (gm *GroupMember) Refresh() error {
	query := `SELECT id, group_id, user_id, status, created_at, updated_at 
		FROM group_members WHERE id = ?`
	return DB.QueryRow(query, gm.ID).Scan(
		&gm.ID, &gm.GroupID, &gm.UserID, &gm.Status, &gm.CreatedAt, &gm.UpdatedAt)
}

func (gm *GroupMember) Exists() bool {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM group_members WHERE id = ?)`
	DB.QueryRow(query, gm.ID).Scan(&exists)
	return exists
}

// GroupPost CRUD methods
func (gp *GroupPost) Index() ([]Model, error) {
	var posts []Model
	rows, err := DB.Query(`SELECT id, group_id, user_id, title, content, media, 
		created_at, updated_at FROM group_posts`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var post GroupPost
		err = rows.Scan(&post.ID, &post.GroupID, &post.UserID, &post.Title, 
			&post.Content, &post.Media, &post.CreatedAt, &post.UpdatedAt)
		if err != nil {
			return nil, err
		}
		posts = append(posts, &post)
	}
	return posts, nil
}

func (gp *GroupPost) Create() error {
	query := `INSERT INTO group_posts (group_id, user_id, title, content, media) 
		VALUES (?, ?, ?, ?, ?)`
	result, err := DB.Exec(query, gp.GroupID, gp.UserID, gp.Title, gp.Content, gp.Media)
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	gp.ID = int(id)
	return nil
}

func (gp *GroupPost) Update() error {
	query := `UPDATE group_posts SET title = ?, content = ?, media = ?, 
		updated_at = CURRENT_TIMESTAMP WHERE id = ?`
	_, err := DB.Exec(query, gp.Title, gp.Content, gp.Media, gp.ID)
	return err
}

func (gp *GroupPost) Delete() error {
	query := `DELETE FROM group_posts WHERE id = ?`
	_, err := DB.Exec(query, gp.ID)
	return err
}

func (gp *GroupPost) Refresh() error {
	query := `SELECT id, group_id, user_id, title, content, media, created_at, updated_at 
		FROM group_posts WHERE id = ?`
	return DB.QueryRow(query, gp.ID).Scan(
		&gp.ID, &gp.GroupID, &gp.UserID, &gp.Title, &gp.Content, &gp.Media, 
		&gp.CreatedAt, &gp.UpdatedAt)
}

func (gp *GroupPost) Exists() bool {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM group_posts WHERE id = ?)`
	DB.QueryRow(query, gp.ID).Scan(&exists)
	return exists
}

// GroupEvent CRUD methods
func (ge *GroupEvent) Index() ([]Model, error) {
	var events []Model
	rows, err := DB.Query(`SELECT id, group_id, creator_id, title, description, 
		date_time, created_at, updated_at FROM group_events`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var event GroupEvent
		err = rows.Scan(&event.ID, &event.GroupID, &event.CreatorID, &event.Title, 
			&event.Description, &event.DateTime, &event.CreatedAt, &event.UpdatedAt)
		if err != nil {
			return nil, err
		}
		events = append(events, &event)
	}
	return events, nil
}

func (ge *GroupEvent) Create() error {
	query := `INSERT INTO group_events (group_id, creator_id, title, description, date_time) 
		VALUES (?, ?, ?, ?, ?)`
	result, err := DB.Exec(query, ge.GroupID, ge.CreatorID, ge.Title, ge.Description, ge.DateTime)
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	ge.ID = int(id)
	return nil
}

func (ge *GroupEvent) Update() error {
	query := `UPDATE group_events SET title = ?, description = ?, date_time = ?, 
		updated_at = CURRENT_TIMESTAMP WHERE id = ?`
	_, err := DB.Exec(query, ge.Title, ge.Description, ge.DateTime, ge.ID)
	return err
}

func (ge *GroupEvent) Delete() error {
	query := `DELETE FROM group_events WHERE id = ?`
	_, err := DB.Exec(query, ge.ID)
	return err
}

func (ge *GroupEvent) Refresh() error {
	query := `SELECT id, group_id, creator_id, title, description, date_time, 
		created_at, updated_at FROM group_events WHERE id = ?`
	return DB.QueryRow(query, ge.ID).Scan(
		&ge.ID, &ge.GroupID, &ge.CreatorID, &ge.Title, &ge.Description, 
		&ge.DateTime, &ge.CreatedAt, &ge.UpdatedAt)
}

func (ge *GroupEvent) Exists() bool {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM group_events WHERE id = ?)`
	DB.QueryRow(query, ge.ID).Scan(&exists)
	return exists
}

// GroupEventResponse CRUD methods
func (ger *GroupEventResponse) Index() ([]Model, error) {
	var responses []Model
	rows, err := DB.Query(`SELECT id, event_id, user_id, response, created_at, updated_at 
		FROM group_event_responses`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var response GroupEventResponse
		err = rows.Scan(&response.ID, &response.EventID, &response.UserID, 
			&response.Response, &response.CreatedAt, &response.UpdatedAt)
		if err != nil {
			return nil, err
		}
		responses = append(responses, &response)
	}
	return responses, nil
}

func (ger *GroupEventResponse) Create() error {
	query := `INSERT INTO group_event_responses (event_id, user_id, response) 
		VALUES (?, ?, ?)`
	result, err := DB.Exec(query, ger.EventID, ger.UserID, ger.Response)
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	ger.ID = int(id)
	return nil
}

func (ger *GroupEventResponse) Update() error {
	query := `UPDATE group_event_responses SET response = ?, 
		updated_at = CURRENT_TIMESTAMP WHERE id = ?`
	_, err := DB.Exec(query, ger.Response, ger.ID)
	return err
}

func (ger *GroupEventResponse) Delete() error {
	query := `DELETE FROM group_event_responses WHERE id = ?`
	_, err := DB.Exec(query, ger.ID)
	return err
}

func (ger *GroupEventResponse) Refresh() error {
	query := `SELECT id, event_id, user_id, response, created_at, updated_at 
		FROM group_event_responses WHERE id = ?`
	return DB.QueryRow(query, ger.ID).Scan(
		&ger.ID, &ger.EventID, &ger.UserID, &ger.Response, 
		&ger.CreatedAt, &ger.UpdatedAt)
}

func (ger *GroupEventResponse) Exists() bool {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM group_event_responses WHERE id = ?)`
	DB.QueryRow(query, ger.ID).Scan(&exists)
	return exists
}

// GroupMessage CRUD methods
func (gm *GroupMessage) CreateTable() error {
	query := `CREATE TABLE IF NOT EXISTS group_messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		group_id INTEGER NOT NULL,
		sender_id INTEGER NOT NULL,
		content TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
		FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
	)`
	_, err := DB.Exec(query)
	return err
}

func (gm *GroupMessage) Index() ([]Model, error) {
	var messages []Model
	rows, err := DB.Query(`SELECT id, group_id, sender_id, content, created_at 
		FROM group_messages`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var message GroupMessage
		err = rows.Scan(&message.ID, &message.GroupID, &message.SenderID, 
			&message.Content, &message.CreatedAt)
		if err != nil {
			return nil, err
		}
		messages = append(messages, &message)
	}
	return messages, nil
}

func (gm *GroupMessage) Create() error {
	query := `INSERT INTO group_messages (group_id, sender_id, content) VALUES (?, ?, ?)`
	result, err := DB.Exec(query, gm.GroupID, gm.SenderID, gm.Content)
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	gm.ID = int(id)
	return nil
}

func (gm *GroupMessage) Update() error {
	query := `UPDATE group_messages SET content = ? WHERE id = ?`
	_, err := DB.Exec(query, gm.Content, gm.ID)
	return err
}

func (gm *GroupMessage) Delete() error {
	query := `DELETE FROM group_messages WHERE id = ?`
	_, err := DB.Exec(query, gm.ID)
	return err
}

func (gm *GroupMessage) Refresh() error {
	query := `SELECT id, group_id, sender_id, content, created_at 
		FROM group_messages WHERE id = ?`
	return DB.QueryRow(query, gm.ID).Scan(
		&gm.ID, &gm.GroupID, &gm.SenderID, &gm.Content, &gm.CreatedAt)
}

func (gm *GroupMessage) Exists() bool {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM group_messages WHERE id = ?)`
	DB.QueryRow(query, gm.ID).Scan(&exists)
	return exists
}

// Helper functions for group messages
func GetGroupMessageHistory(groupID, limit, offset int) ([]GroupMessage, error) {
	query := `
		SELECT m.id, m.group_id, m.sender_id, m.content, m.created_at,
			   u.username as sender_username, u.first_name as sender_first_name, 
			   u.last_name as sender_last_name
		FROM group_messages m
		JOIN users u ON m.sender_id = u.id
		WHERE m.group_id = ?
		ORDER BY m.created_at DESC
		LIMIT ? OFFSET ?
	`
	rows, err := DB.Query(query, groupID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []GroupMessage
	for rows.Next() {
		var msg GroupMessage
		var senderUsername, senderFirstName, senderLastName string
		err = rows.Scan(
			&msg.ID, &msg.GroupID, &msg.SenderID, &msg.Content, &msg.CreatedAt,
			&senderUsername, &senderFirstName, &senderLastName,
		)
		if err != nil {
			return nil, err
		}

		msg.Sender = &User{
			ID:        msg.SenderID,
			Username:  senderUsername,
			FirstName: senderFirstName,
			LastName:  senderLastName,
		}

		messages = append(messages, msg)
	}

	return messages, nil
}

func SaveGroupMessage(groupID, senderID int, content string) error {
	message := &GroupMessage{
		GroupID:  groupID,
		SenderID: senderID,
		Content:  content,
	}
	return message.Create()
}
