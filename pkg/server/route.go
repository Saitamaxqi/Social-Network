package server

import (
	"forum/pkg/middlewares"
	"forum/pkg/requests"
	"net/http"
)

func GET(path string, handler func(w http.ResponseWriter, r *http.Request), request requests.Request, middleware middlewares.Middleware) {
	Router.HandleFunc("GET "+path, middleware(request(handler)))
}

func POST(path string, handler func(w http.ResponseWriter, r *http.Request), request requests.Request, middleware middlewares.Middleware) {
	Router.HandleFunc("POST "+path, middleware(request(handler)))
}

func PUT(path string, handler func(w http.ResponseWriter, r *http.Request), request requests.Request, middleware middlewares.Middleware) {
	Router.HandleFunc("PUT "+path, middleware(request(handler)))
}

func DELETE(path string, handler func(w http.ResponseWriter, r *http.Request), request requests.Request, middleware middlewares.Middleware) {
	Router.HandleFunc("DELETE "+path, middleware(request(handler)))
}

func WEB(path string, handler func(w http.ResponseWriter, r *http.Request), request requests.Request, middleware middlewares.Middleware) {
	Router.HandleFunc(path, middleware(request(handler)))
}
