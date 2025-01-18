package responses

import (
	"net/http"
)

type ResponseWriter struct {
	http.ResponseWriter
	status int
	body   []byte
}

func (w *ResponseWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

func (w *ResponseWriter) Header() http.Header {
	return w.ResponseWriter.Header()
}

func (w *ResponseWriter) Status() int {
	return w.status
}

func (w *ResponseWriter) Write(b []byte) (int, error) {
	w.body = append(w.body, b...)
	return w.ResponseWriter.Write(b)
}

func (w *ResponseWriter) Body() []byte {
	return w.body
}

func NewResponseWriter(w http.ResponseWriter) *ResponseWriter {
	return &ResponseWriter{w, http.StatusOK, []byte{}}
}
