package responses

import (
	"forum/pkg/consts"
	"forum/pkg/models"
)

type GithubUserResponse struct {
	Login  string `json:"login"`
	Email  string `json:"email"`
	ID     int    `json:"id"`
	NodeID string `json:"node_id"`
}

func (r *GithubUserResponse) User() *models.User {
	user, err := models.GetUserByNicknameOrEmail(r.Email)
	if err == nil {
		return user
	}

	// If user not found, create a new user
	user = &models.User{
		Username: r.Login,
		Email:    r.Email,
		Password: r.NodeID,
		Type:     consts.USER,
	}

	err = user.Create()
	if err != nil {
		return nil
	}

	return user
}
