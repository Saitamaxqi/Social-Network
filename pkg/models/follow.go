package models

import (
    // "database/sql"
    "errors"
    "time"
)

type Follow struct {
    ID          int       `json:"id"`
    FollowerID  int       `json:"follower_id"`
    FollowingID int       `json:"following_id"`
    Status      string    `json:"status"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
    Follower    *User     `json:"follower,omitempty"`
    Following   *User     `json:"following,omitempty"`
}

func (f *Follow) CreateTable() error {
    query := `CREATE TABLE IF NOT EXISTS follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_id INTEGER NOT NULL,
        following_id INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(follower_id, following_id)
    )`
    _, err := DB.Exec(query)
    return err
}

// Add these methods to complete the Model interface

func (f *Follow) Index() ([]Model, error) {
    rows, err := DB.Query("SELECT * FROM follows")
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var follows []Model
    for rows.Next() {
        follow := &Follow{}
        err = rows.Scan(&follow.ID, &follow.FollowerID, &follow.FollowingID, 
            &follow.Status, &follow.CreatedAt, &follow.UpdatedAt)
        if err != nil {
            return nil, err
        }
        follows = append(follows, follow)
    }
    return follows, nil
}

func (f *Follow) Refresh() error {
    return DB.QueryRow("SELECT * FROM follows WHERE id = ?", f.ID).
        Scan(&f.ID, &f.FollowerID, &f.FollowingID, &f.Status, 
            &f.CreatedAt, &f.UpdatedAt)
}

func (f *Follow) Exists() bool {
    var exists bool
     DB.QueryRow(`
        SELECT EXISTS (
            SELECT 1 FROM follows 
            WHERE follower_id = ? AND following_id = ?
        )`,
        f.FollowerID, f.FollowingID).Scan(&exists)
    return exists
}

func (f *Follow) Update() error {
    _, err := DB.Exec(`
        UPDATE follows 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?`,
        f.Status, f.ID)
    return err
}

func (f *Follow) Delete() error {
    _, err := DB.Exec(`DELETE FROM follows WHERE id = ?`, f.ID)
    return err
}

func (f *Follow) Create() error {
    exists := f.Exists()
    if exists {
        return errors.New("follow relationship already exists")
    }

    targetUser := &User{ID: f.FollowingID}
    err := targetUser.Refresh()
    if err != nil {
        return err
    }

    if targetUser.ProfileType == "public" {
        f.Status = "accepted"
    } else {
        f.Status = "pending"
    }

    result, err := DB.Exec(`
        INSERT INTO follows (follower_id, following_id, status) 
        VALUES (?, ?, ?)`,
        f.FollowerID, f.FollowingID, f.Status)
    if err != nil {
        return err
    }

    id, err := result.LastInsertId()
    f.ID = int(id)
    return err
}

func (f *Follow) GetByID(id int) error {
    return DB.QueryRow(`
        SELECT id, follower_id, following_id, status, created_at, updated_at 
        FROM follows WHERE id = ?`,
        id).Scan(&f.ID, &f.FollowerID, &f.FollowingID, &f.Status, &f.CreatedAt, &f.UpdatedAt)
}

func (f *Follow) LoadRelations() error {
    follower := &User{ID: f.FollowerID}
    following := &User{ID: f.FollowingID}

    err := follower.Refresh()
    if err != nil {
        return err
    }

    err = following.Refresh()
    if err != nil {
        return err
    }

    follower.HideDetails()
    following.HideDetails()

    f.Follower = follower
    f.Following = following
    return nil
}

// Add these methods to your existing User struct

func (u *User) GetFollowers() ([]*User, error) {
    rows, err := DB.Query(`
        SELECT u.* FROM users u 
        JOIN follows f ON u.id = f.follower_id 
        WHERE f.following_id = ? AND f.status = 'accepted'`, u.ID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var followers []*User
    for rows.Next() {
        follower := &User{}
        err = rows.Scan(&follower.ID, &follower.Username, &follower.Age, &follower.Gender, 
            &follower.FirstName, &follower.LastName, &follower.Email, &follower.Password, 
            &follower.Type, &follower.Requested, &follower.Avatar, &follower.ProfileType, 
            &follower.AboutMe, &follower.CreatedAt, &follower.UpdatedAt)
        if err != nil {
            return nil, err
        }
        follower.HideDetails()
        followers = append(followers, follower)
    }
    return followers, nil
}

func (u *User) GetFollowing() ([]*User, error) {
    rows, err := DB.Query(`
        SELECT u.* FROM users u 
        JOIN follows f ON u.id = f.following_id 
        WHERE f.follower_id = ? AND f.status = 'accepted'`, u.ID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var following []*User
    for rows.Next() {
        followedUser := &User{}
        err = rows.Scan(&followedUser.ID, &followedUser.Username, &followedUser.Age, 
            &followedUser.Gender, &followedUser.FirstName, &followedUser.LastName, 
            &followedUser.Email, &followedUser.Password, &followedUser.Type, 
            &followedUser.Requested, &followedUser.Avatar, &followedUser.ProfileType, 
            &followedUser.AboutMe, &followedUser.CreatedAt, &followedUser.UpdatedAt)
        if err != nil {
            return nil, err
        }
        followedUser.HideDetails()
        following = append(following, followedUser)
    }
    return following, nil
}

// func (u *User) IsFollowing(targetUserID int) (bool, error) {
//     var exists bool
//     err := DB.QueryRow(`
//         SELECT EXISTS (
//             SELECT 1 FROM follows 
//             WHERE follower_id = ? AND following_id = ? AND status = 'accepted'
//         )`, u.ID, targetUserID).Scan(&exists)
//     return exists, err
// }


// func GetPendingFollowRequests(userID int) ([]*Follow, error) {
//     rows, err := DB.Query(`
//         SELECT id, follower_id, following_id, status, created_at, updated_at 
//         FROM follows 
//         WHERE following_id = ? AND status = 'pending'`,
//         userID)
//     if err != nil {
//         return nil, err
//     }
//     defer rows.Close()

//     var follows []*Follow
//     for rows.Next() {
//         follow := &Follow{}
//         err = rows.Scan(
//             &follow.ID, &follow.FollowerID, &follow.FollowingID,
//             &follow.Status, &follow.CreatedAt, &follow.UpdatedAt)
//         if err != nil {
//             return nil, err
//         }
//         err = follow.LoadRelations()
//         if err != nil {
//             return nil, err
//         }
//         follows = append(follows, follow)
//     }
//     return follows, nil
// }
