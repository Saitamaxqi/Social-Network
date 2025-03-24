CREATE TABLE IF NOT EXISTS users (
    id                  INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    username            VARCHAR(50) NOT NULL UNIQUE,
    date_of_birth       DATETIME NOT NULL,
    gender              VARCHAR(10) NOT NULL,
    first_name          VARCHAR(50) NOT NULL,
    last_name           VARCHAR(50) NOT NULL,
    email               VARCHAR(50) NOT NULL UNIQUE,
    password            VARCHAR NOT NULL,
    type                VARCHAR NOT NULL,
    requested           BOOLEAN DEFAULT FALSE,
    avatar              VARCHAR(255),
    profile_type        VARCHAR(50) DEFAULT 'public',
    about_me            TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_email UNIQUE (email)
);
