package models

import (
	"time"
)

type PrivateMessage struct {
	ID         int       `json:"id"`
	SenderID   int       `json:"sender_id"`
	RecipientID int      `json:"recipient_id"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"created_at"`
	Sender     User      `json:"sender"`
	Recipient  User      `json:"recipient"`
}

func (pm *PrivateMessage) CreateTable() error {
    _, err := DB.Exec(`CREATE TABLE IF NOT EXISTS private_messages (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        recipient_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (Recipient_id) REFERENCES users(id) ON DELETE CASCADE
    )`)
    return err
}

func (pm *PrivateMessage) Index() ([]Model, error) {
    rows, err := DB.Query(`SELECT * FROM private_messages`)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var messages []Model
    for rows.Next() {
        message := &PrivateMessage{}
        err = rows.Scan(&message.ID, &message.SenderID, &message.RecipientID, &message.Content, &message.CreatedAt)
        if err != nil {
            return nil, err
        }
        messages = append(messages, message)
    }

    if err = rows.Err(); err != nil {
        return nil, err
    }

    return messages, nil
}
func (pm *PrivateMessage) Create() error {
    result, err := DB.Exec(`INSERT INTO private_messages (sender_id, Recipient_id, content) VALUES (?, ?, ?)`,
        pm.SenderID, pm.RecipientID, pm.Content)
    if err != nil {
        return err
    }

    id, err := result.LastInsertId()
    if err != nil {
        return err
    }

    pm.ID = int(id)
    return nil
}

func (pm *PrivateMessage) Update() error {
    _, err := DB.Exec(`UPDATE private_messages SET content = ? WHERE id = ?`, pm.Content, pm.ID)
    return err
}

func (pm *PrivateMessage) Delete() error {
    _, err := DB.Exec(`DELETE FROM private_messages WHERE id = ?`, pm.ID)
    return err
}

func (pm *PrivateMessage) Refresh() error {
    return DB.QueryRow(`SELECT * FROM private_messages WHERE id = ?`, pm.ID).
        Scan(&pm.ID, &pm.SenderID, &pm.RecipientID, &pm.Content, &pm.CreatedAt)
}
func (pm *PrivateMessage) Exists() bool {
    var exists bool
    err := DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM private_messages WHERE id = ?)`, pm.ID).Scan(&exists)
    return err == nil && exists
}


func GetChatHistory(userID, otherUserID, limit, offset int) ([]PrivateMessage, error) {
	query := `
		SELECT pm.id, pm.sender_id, pm.recipient_id, pm.content, pm.created_at,
			   s.username as sender_username, r.username as recipient_username
		FROM private_messages pm
		JOIN users s ON pm.sender_id = s.id
		JOIN users r ON pm.recipient_id = r.id
		WHERE (pm.sender_id = ? AND pm.recipient_id = ?) OR (pm.sender_id = ? AND pm.recipient_id = ?)
		ORDER BY pm.created_at DESC
		LIMIT ? OFFSET ?
	`
	rows, err := DB.Query(query, userID, otherUserID, otherUserID, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []PrivateMessage
	for rows.Next() {
		var msg PrivateMessage
		err := rows.Scan(&msg.ID, &msg.SenderID, &msg.RecipientID, &msg.Content, &msg.CreatedAt,
						 &msg.Sender.Username, &msg.Recipient.Username)
		if err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}

	return messages, nil
}

func SavePrivateMessage(senderID, recipientID int, content string) error {
	_, err := DB.Exec(`
		INSERT INTO private_messages (sender_id, recipient_id, content)
		VALUES (?, ?, ?)
	`, senderID, recipientID, content)
	return err
}

func GetAllUsersOrderedByRecentChats(userID int) ([]User, error) {
    query := `
    SELECT id, username FROM (
        SELECT u.id, u.username, MAX(pm.created_at) as last_message
        FROM users u
        LEFT JOIN private_messages pm ON (u.id = pm.sender_id AND pm.recipient_id = ?)
                                      OR (u.id = pm.recipient_id AND pm.sender_id = ?)
        WHERE u.id != ?
        GROUP BY u.id, u.username
        ORDER BY last_message DESC NULLS LAST, LOWER(username) ASC
    ) AS ordered_users
    `
    rows, err := DB.Query(query, userID, userID, userID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var users []User
    for rows.Next() {
        var user User
        err := rows.Scan(&user.ID, &user.Username)
        if err != nil {
            return nil, err
        }
        users = append(users, user)
    }

    return users, nil
}


