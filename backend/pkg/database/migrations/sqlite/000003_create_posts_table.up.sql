CREATE TABLE IF NOT EXISTS posts (
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
);
