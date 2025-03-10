package socket

import (
	"encoding/json"

	"github.com/gorilla/websocket"
)

type Hub struct {
	Clients    map[int][]*Client // Map of userID to their clients
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan []byte        // Channel for broadcasting messages to all clients
	Direct     chan DirectMessage // Channel for sending messages to specific clients
}

type DirectMessage struct {
	UserID int
	Data   []byte
}
type Client struct {
	Hub    *Hub
	UserID int
	Conn   *websocket.Conn
	Send   chan []byte
}

func NewHub() *Hub {
	return &Hub{
		Clients:    make(map[int][]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan []byte),
		Direct:     make(chan DirectMessage),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			if client.UserID != 0 {
				h.Clients[client.UserID] = append(h.Clients[client.UserID], client)
			}

		case client := <-h.Unregister:
			if clients, exists := h.Clients[client.UserID]; exists {
				for i, c := range clients {
					if c == client {
						h.Clients[client.UserID] = append(clients[:i], clients[i+1:]...)
						close(client.Send)
						break
					}
				}
				// Remove the user's entry if they have no active clients
				if len(h.Clients[client.UserID]) == 0 {
					delete(h.Clients, client.UserID)
				}
			}

		case message := <-h.Broadcast:
			// Send to all connected clients
			for _, clients := range h.Clients {
				for _, client := range clients {
					select {
					case client.Send <- message:
					default:
						close(client.Send)
						h.Unregister <- client
					}
				}
			}

		case message := <-h.Direct:
			// Send to specific user's clients
			if clients, exists := h.Clients[message.UserID]; exists {
				for _, client := range clients {
					select {
					case client.Send <- message.Data:
					default:
						close(client.Send)
						h.Unregister <- client
					}
				}
			}
		}
	}
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()
	for {
		_, _, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}
		// We don't process incoming messages from clients
		// Notifications are sent from the server side
	}
}

func (c *Client) WritePump() {
	defer c.Conn.Close()
	for {
		select {
		case message, ok := <-c.Send:
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.Conn.WriteMessage(websocket.TextMessage, message)
		}
	}
}

// SendToUser sends a message to a specific user
func (h *Hub) SendToUser(userID int, data interface{}) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	h.Direct <- DirectMessage{
		UserID: userID,
		Data:   jsonData,
	}
	return nil
}

// BroadcastMessage sends a message to all connected clients
func (h *Hub) BroadcastMessage(data interface{}) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	h.Broadcast <- jsonData
	return nil
}
