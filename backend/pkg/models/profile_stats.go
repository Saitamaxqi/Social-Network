package models

type ProfileStats struct {
	PostsCount     int `json:"posts_count"`
	FollowersCount int `json:"followers_count"`
	FollowingCount int `json:"following_count"`
}

// GetUserStats returns profile statistics for a given user ID
func GetUserStats(userID int) (*ProfileStats, error) {
	stats := &ProfileStats{}

	// Get posts count
	err := DB.QueryRow("SELECT COUNT(*) FROM posts WHERE user_id = ? AND post_id IS NULL AND visibility != 'group'", userID).Scan(&stats.PostsCount)
	if err != nil {
		return nil, err
	}

	// Get followers count
	err = DB.QueryRow("SELECT COUNT(*) FROM follows WHERE following_id = ? AND status = 'accepted'", userID).Scan(&stats.FollowersCount)
	if err != nil {
		return nil, err
	}

	// Get following count
	err = DB.QueryRow("SELECT COUNT(*) FROM follows WHERE follower_id = ? AND status = 'accepted'", userID).Scan(&stats.FollowingCount)
	if err != nil {
		return nil, err
	}

	return stats, nil
}
