package controllers

import (
	"context"
	"encoding/json"
	"forum/pkg/env"
	"forum/pkg/responses"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
	"net/http"
)

var (
	githubOauthConfig *oauth2.Config
	googleOauthConfig *oauth2.Config
	oauthStateString  string
	callbackURL       string
)

func ThirdPartyController(w http.ResponseWriter, r *http.Request) {
	initOAuthConfigs()
	switch r.URL.Path {
	case "/login/google":
		LoginGoogle(w, r)
	case "/login/github":
		LoginGithub(w, r)
	case "/callback/google":
		CallbackGoogle(w, r)
	case "/callback/github":
		CallbackGithub(w, r)
	}
}

func initOAuthConfigs() {
	oauthStateString = env.Get("OAUTH_STATE_STRING")
	callbackURL = env.Get("PROTOCOL") + env.Get("SERVER_CALLBACK_URL")

	googleOauthConfig = &oauth2.Config{
		RedirectURL:  callbackURL + "/google",
		ClientID:     env.Get("GOOGLE_CLIENT_ID"),
		ClientSecret: env.Get("GOOGLE_CLIENT_SECRET"),
		Endpoint:     google.Endpoint,
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email"},
	}

	githubOauthConfig = &oauth2.Config{
		RedirectURL:  callbackURL + "/github",
		ClientID:     env.Get("GITHUB_CLIENT_ID"),
		ClientSecret: env.Get("GITHUB_CLIENT_SECRET"),
		Endpoint:     github.Endpoint,
	}
}

func LoginGoogle(w http.ResponseWriter, r *http.Request) {
	url := googleOauthConfig.AuthCodeURL(oauthStateString)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func LoginGithub(w http.ResponseWriter, r *http.Request) {
	url := githubOauthConfig.AuthCodeURL(oauthStateString)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func CallbackGoogle(w http.ResponseWriter, r *http.Request) {
	state := r.FormValue("state")
	if state != oauthStateString {
		MessageController(w, r, "Invalid OAuth state", "error")
		return
	}

	code := r.FormValue("code")
	token, err := googleOauthConfig.Exchange(r.Context(), code)
	if err != nil {
		MessageController(w, r, "Failed to exchange token", "error")
		return
	}

	client := googleOauthConfig.Client(context.TODO(), token)
	userInfoURL := env.Get("GOOGLE_USER_INFO_URL")
	resp, err := client.Get(userInfoURL)
	if err != nil {
		MessageController(w, r, "Failed to get user info", "error")
		return
	}
	defer resp.Body.Close()

	var userInfo responses.GoogleUserResponse
	err = json.NewDecoder(resp.Body).Decode(&userInfo)
	if err != nil {
		MessageController(w, r, "Failed to decode user info", "error")
		return
	}

	user := userInfo.User()

	loginThirdParty(w, r, user)
}

func CallbackGithub(w http.ResponseWriter, r *http.Request) {
	state := r.FormValue("state")
	if state != oauthStateString {
		MessageController(w, r, "Invalid OAuth state", "error")
		return
	}

	code := r.FormValue("code")
	token, err := githubOauthConfig.Exchange(r.Context(), code)
	if err != nil {
		MessageController(w, r, "Failed to exchange token", "error")
		return
	}

	client := githubOauthConfig.Client(context.TODO(), token)
	userInfoURL := env.Get("GITHUB_USER_INFO_URL")
	resp, err := client.Get(userInfoURL)
	if err != nil {
		MessageController(w, r, "Failed to get user info", "error")
		return
	}
	defer resp.Body.Close()

	var userInfo responses.GithubUserResponse
	err = json.NewDecoder(resp.Body).Decode(&userInfo)
	if err != nil {
		MessageController(w, r, "Failed to decode user info", "error")
		return
	}

	user := userInfo.User()

	loginThirdParty(w, r, user)
}
