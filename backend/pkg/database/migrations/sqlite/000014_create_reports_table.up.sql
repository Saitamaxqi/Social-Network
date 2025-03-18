CREATE TABLE IF NOT EXISTS reports (
    id                 	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    content           	VARCHAR NOT NULL,
    type                VARCHAR NOT NULL,
    approved            BOOLEAN DEFAULT FALSE,
    post_id             INTEGER NOT NULL,
    user_id             INTEGER NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
