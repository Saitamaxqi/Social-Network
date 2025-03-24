CREATE TABLE IF NOT EXISTS sessions (
    uuid            VARCHAR NOT NULL PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
