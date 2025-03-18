CREATE TABLE IF NOT EXISTS notifications (
    id                 	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    user_id           	INTEGER NOT NULL,
    text           		TEXT NOT NULL,
    seen           		BOOLEAN DEFAULT FALSE,
    sender_id           INTEGER NOT NULL,
    type           		TEXT NOT NULL,
    link_id           	INTEGER NOT NULL,
    date           		DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
