package server

import (
    "forum/pkg/controllers"
    "forum/pkg/middlewares"
    "forum/pkg/requests"
)

// RegisterAPIs is a function that register all routes
func RegisterAPIs() {
    // Default_component routes (Done)
    GET("/posts", controllers.PostController, requests.DefaultRequest, middlewares.DefaultAPIMiddleware)          // Index
    GET("/posts/{id}", controllers.PostController, requests.DefaultRequest, middlewares.DefaultAPIMiddleware)     // Show
    POST("/posts", controllers.PostController, requests.PostRequest, middlewares.AuthMiddleware)                  // Create
    PUT("/posts/{id}", controllers.PostController, requests.PostRequest, middlewares.AuthMiddleware)              // Update
    DELETE("/posts/{id}", controllers.PostController, requests.DefaultRequest, middlewares.AuthMiddleware)        // Delete
    DELETE("/posts/{id}/media", controllers.DeletePostMedia, requests.DefaultRequest, middlewares.AuthMiddleware) // Delete media
    // Like/Dislike and Comment routes (Done)
    PUT("/posts/{id}/interact", controllers.InteractPost, requests.PostInteractionRequest, middlewares.AuthMiddleware) // Like/Dislike
    POST("/posts/{id}/comment", controllers.CommentPost, requests.CommentRequest, middlewares.AuthMiddleware)          // Comment
    // Category routes (Done)
    GET("/categories", controllers.CategoryController, requests.DefaultRequest, middlewares.DefaultAPIMiddleware)      // Index
    GET("/categories/{id}", controllers.CategoryController, requests.DefaultRequest, middlewares.DefaultAPIMiddleware) // Show
    POST("/categories", controllers.CategoryController, requests.CategoryRequest, middlewares.AdminMiddleware)         // Create
    PUT("/categories/{id}", controllers.CategoryController, requests.CategoryRequest, middlewares.AdminMiddleware)     // Update
    DELETE("/categories/{id}", controllers.CategoryController, requests.DefaultRequest, middlewares.AdminMiddleware)   // Delete
    //// Report routes (Done)
    GET("/reports", controllers.ReportController, requests.DefaultRequest, middlewares.ModeratorMiddleware)           // Index
    GET("/reports/{id}", controllers.ReportController, requests.DefaultRequest, middlewares.ModeratorMiddleware)      // Show
    POST("/posts/{id}/report", controllers.ReportController, requests.ReportRequest, middlewares.ModeratorMiddleware) // Create
    PUT("/reports/{id}", controllers.ReportController, requests.ReportRequest, middlewares.AdminMiddleware)           // Update
    DELETE("/reports/{id}", controllers.ReportController, requests.DefaultRequest, middlewares.ModeratorMiddleware)   // Delete
    PUT("/reports/{id}/approve", controllers.ApproveReport, requests.DefaultRequest, middlewares.AdminMiddleware)     // Approve
    //// Profile routes(Done)
    GET("/activity", controllers.ActivityController, requests.DefaultRequest, middlewares.AuthMiddleware) // Index
    // User routes (Done)
    GET("/users", controllers.UserController, requests.DefaultRequest, middlewares.AdminMiddleware)         // Index
    GET("/users/{id}", controllers.UserController, requests.DefaultRequest, middlewares.AdminMiddleware)    // Show
    PUT("/users/{id}", controllers.UserController, requests.UserRequest, middlewares.AdminMiddleware)       // Update
    DELETE("/users/{id}", controllers.UserController, requests.DefaultRequest, middlewares.AdminMiddleware) // Delete
    // Moderator request routes (Done)
    GET("/requests", controllers.ModeratorController, requests.DefaultRequest, middlewares.AdminMiddleware)         // Get moderator requests
    POST("/requests", controllers.ModeratorController, requests.DefaultRequest, middlewares.AuthMiddleware)         // Request moderator
    PUT("/requests/{id}", controllers.ModeratorController, requests.DefaultRequest, middlewares.AdminMiddleware)    // Approve moderator request
    DELETE("/requests/{id}", controllers.ModeratorController, requests.DefaultRequest, middlewares.AdminMiddleware) // Reject moderator request
    // Profile routes(Done)
    GET("/profile/{id}", controllers.ProfileController, requests.DefaultRequest, middlewares.AuthMiddleware) // Show
    PUT("/profile", controllers.ProfileController, requests.ProfileRequest, middlewares.AuthMiddleware) // Update
    // Notification routes(Done)
    GET("/notifications", controllers.NotificationController, requests.DefaultRequest, middlewares.AuthMiddleware)      // Index
    PUT("/notifications/{id}", controllers.NotificationController, requests.DefaultRequest, middlewares.AuthMiddleware) // Update
    PUT("/notifications", controllers.NotificationController, requests.DefaultRequest, middlewares.AuthMiddleware)      // Update all
    DELETE("/notifications/{id}", controllers.NotificationController, requests.DefaultRequest, middlewares.AuthMiddleware)   // Delete
    // Auth routes (Done)
    POST("/login", controllers.AuthController, requests.LoginRequest, middlewares.DefaultAPIMiddleware)       // Login
    GET("/login-session", controllers.AuthController, requests.DefaultRequest, middlewares.AuthMiddleware)    // Login session
    GET("/check-session", controllers.AuthController, requests.DefaultRequest, middlewares.AuthMiddleware)    // Check session
    POST("/register", controllers.AuthController, requests.RegisterRequest, middlewares.DefaultAPIMiddleware)

    // Group routes
    GET("/groups", controllers.GetGroups, requests.DefaultRequest, middlewares.AuthMiddleware)                           // Get all groups
    GET("/groups/{id}", controllers.GetGroup, requests.DefaultRequest, middlewares.AuthMiddleware)                      // Get specific group
    POST("/groups", controllers.CreateGroup, requests.GroupRequest, middlewares.AuthMiddleware)                          // Create new group

    // Group membership routes
    POST("/groups/{id}/join", controllers.RequestToJoinGroup, requests.DefaultRequest, middlewares.AuthMiddleware)      // Request to join group
    POST("/groups/{id}/invite", controllers.InviteToGroup, requests.DefaultRequest, middlewares.AuthMiddleware)     // Invite user to group
    POST("/groups/{id}/respond-invite", controllers.RespondToInvitation, requests.DefaultRequest, middlewares.AuthMiddleware)  // Respond to invitation
    POST("/groups/{id}/respond-request", controllers.RespondToJoinRequest, requests.DefaultRequest, middlewares.AuthMiddleware)  // Respond to join request

    // Group posts routes
    GET("/groups/{id}/posts", controllers.GetGroupPosts, requests.DefaultRequest, middlewares.AuthMiddleware)           // Get group posts
    POST("/groups/{id}/posts", controllers.CreateGroupPost, requests.GroupPostRequest, middlewares.AuthMiddleware)      // Create group post

    // Group events routes
    GET("/groups/{id}/events", controllers.GetGroupEvents, requests.DefaultRequest, middlewares.AuthMiddleware)         // Get group events
    POST("/groups/{id}/events", controllers.CreateGroupEvent, requests.DefaultRequest, middlewares.AuthMiddleware)    // Create group event
    POST("/groups/{id}/events/{event_id}/respond", controllers.RespondToEvent, requests.DefaultRequest, middlewares.AuthMiddleware)  // Respond to event

    // Group messages routes
    GET("/groups/{id}/messages", controllers.GetGroupMessages, requests.DefaultRequest, middlewares.AuthMiddleware)     // Get group messages
    POST("/groups/{id}/messages", controllers.SendGroupMessage, requests.DefaultRequest, middlewares.AuthMiddleware)  // Send group message
    GET("/logout", controllers.AuthController, requests.DefaultRequest, middlewares.AuthMiddleware)           // Logout
    // Third party routes (Skip)
    WEB("/login/google", controllers.ThirdPartyController, requests.DefaultRequest, middlewares.DefaultAPIMiddleware)    // Google auth
    WEB("/login/github", controllers.ThirdPartyController, requests.DefaultRequest, middlewares.DefaultAPIMiddleware)    // Github auth
    WEB("/callback/google", controllers.ThirdPartyController, requests.DefaultRequest, middlewares.DefaultAPIMiddleware) // Google callback
    WEB("/callback/github", controllers.ThirdPartyController, requests.DefaultRequest, middlewares.DefaultAPIMiddleware) // Github callback
    // Web routes (Skip)
    WEB("/", controllers.HomeController, requests.DefaultRequest, middlewares.CORSMiddleware) // Index
    //chat routes
    GET("/chats", controllers.RecentChatsController, requests.DefaultRequest, middlewares.AuthMiddleware)
    POST("/chats/{id}", controllers.PostPrivateMessageController, requests.DefaultRequest, middlewares.AuthMiddleware)
    GET("/chats/{id}", controllers.GetPrivateMessagesController, requests.DefaultRequest, middlewares.AuthMiddleware)
    //follow routes
    POST("/follow", controllers.FollowController, requests.DefaultRequest, middlewares.AuthMiddleware)
    DELETE("/follow/{id}", controllers.FollowController, requests.DefaultRequest, middlewares.AuthMiddleware)
    PUT("/follow/{id}", controllers.FollowController, requests.DefaultRequest, middlewares.AuthMiddleware)
	
	//close friends routes
	GET("/close-friends", controllers.CloseFriendController, requests.DefaultRequest, middlewares.AuthMiddleware)
	POST("/close-friends", controllers.CloseFriendController, requests.DefaultRequest, middlewares.AuthMiddleware)
}
