CREATE TABLE IF NOT EXISTS post_interactions (
    id                 	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    user_id           	INTEGER NOT NULL,
    post_id           	INTEGER NOT NULL,
    type           		INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
