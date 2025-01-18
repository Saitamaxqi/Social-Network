import {fetchAPI} from "../api.js";
import { WebSocketClient } from '../websocket.js';
import Toastr from "../toastr.js";
import {timeSince} from "../utils.js";
import {currentPage, currentUser} from "../state.js";
import { sanitizeInput } from "../utils.js";

export class Dms {
    constructor() {
        this.content = document.getElementById('content');
        this.webSocket = new WebSocketClient(this);
        this.chatbar = document.getElementById('chat-bar');
        window.sendMessage = this.sendMessage;
        this.fetchAPI = fetchAPI;
    }

    renderDms(id = null) {
        if (id) {
            this.renderChat(id);
            return;
        }
        fetchAPI('/chats')
            .then(response => {
                // console.log('Response:', response);
                const { onlineUsers, recentChats } = response;
                // console.log('Online Users:', onlineUsers);
                // console.log('Recent Chats:', recentChats);
                const ul = document.createElement('ul');
    
                if (Array.isArray(recentChats)) {
                    recentChats.forEach(user => {
                        const card = this.createUserCard(user, onlineUsers[user.username]);
                        ul.appendChild(card);
                    });
                } else {
                    chatbar.innerHTML = '<p>No recent chats found.</p>';
                }
    
                this.chatbar.innerHTML = '';
                // console.log(ul);
                this.chatbar.appendChild(ul);
            })
            .catch(error => {
                // Toastr.error(error);
                // console.log('Error fetching recent chats:', error);
                return
            });
    }
    
    
    

    createUserCard(user, isOnline) {
            const li = document.createElement('li');
            li.classList.add('chat-item');
            li.dataset.userId = user.id; // Added data-user-id attribute
            if (window.location.pathname.includes('chat/'+user.id)) {
                li.classList.add('active');
            } else {
                li.classList.add('inactive');
            }

            const a = document.createElement('a');
            a.href = '';
            a.textContent = user.username.charAt(0).toUpperCase() + user.username.slice(1);
            const statusIcon = document.createElement('i');
            statusIcon.classList.add('fas', 'fa-dot-circle');
            statusIcon.classList.add(isOnline ? 'online' : 'offline');
            
            // Add the status icon to the link
            a.appendChild(statusIcon);
            a.appendChild(document.createTextNode(' '));
            a.onclick = (event) => {
                event.preventDefault();
                navigate(`chat/${user.id}`);
            }
            li.appendChild(a);
            return li;
    }    


    renderChat(id) {
        console.log('Rendering chat for user ID:', id);
        localStorage.setItem('page', '0');
        var page = parseInt(localStorage.getItem('page'),10);
        this.content.innerHTML = '';
    // Create the main container div
    const mainContainer = document.createElement('div');
    mainContainer.classList.add('post-container');
    
    // Create the chat container where messages will appear
    const chatContainer = document.createElement('div');
    chatContainer.classList.add('chat-container');
    //create on scroll up event listener
    chatContainer.addEventListener('scroll', () => {
        if (chatContainer.scrollTop === 0) {
           var pagenew = parseInt(localStorage.getItem('page'),10) + 1;
            localStorage.setItem('page', pagenew.toString());
            this.renderMessages(id, pagenew);
        }
    });
    mainContainer.appendChild(chatContainer);
    
    // Create the input container
    const inputContainer = document.createElement('div');
    inputContainer.classList.add('input-container');
    
    // Create the input field for typing messages
    const messageInput = document.createElement('input');
    messageInput.type = 'text';
    messageInput.id = 'messageInput';
    messageInput.placeholder = 'Type your message...';
    messageInput.maxLength = 2000;
    inputContainer.appendChild(messageInput);
    
    // Create the send button
    const sendMessageButton = document.createElement('button');
    sendMessageButton.id = 'sendMessage';
    sendMessageButton.innerText = 'Send';
    inputContainer.appendChild(sendMessageButton);
    
    // Append the input container to the main container
    mainContainer.appendChild(inputContainer);
    
    // Append the whole chat UI to the document body or to a specific div (e.g. middle div)
    this.content.appendChild(mainContainer);
    
    // Add event listener for the send button
        // Add event listener for the send button
        sendMessageButton.addEventListener('click', () => {
            this.sendMessage(id);
            messageInput.value = '';
        })

        // Add event listener for Enter key press
        messageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.sendMessage(id);
                messageInput.value = '';
            }
        })
        // Add this in your chat initialization
let previousValue = '';
messageInput.addEventListener('keyup', () => {
    if (messageInput.value !== previousValue) {
        this.webSocket.handleTyping(currentUser.id, id);
        previousValue = messageInput.value;
    }
});

        this.renderMessages(id, page);
    }
    
    renderMessages(id, page) {
        var pageContainer = document.createElement('div');
    pageContainer.classList.add('page');
        const chatcontainer = document.querySelector('.chat-container');
        if (!chatcontainer) {
            console.error('Chat container not found');
            return;
        }
        
        this.fetchAPI(`/chats/${id}?page=${page}`)
          .then((messages) => {  
            console.log("Messages:", messages);
            if (Array.isArray(messages) && messages.length > 0) {
                messages.forEach(message => {
                    const messageDiv = document.createElement('div');
                    messageDiv.classList.add('message');

                    messageDiv.innerHTML = `
                        <span class="username">${message.sender.username}</span>
                        <span class="message-content">${message.content}</span>
                        <span class="time">${timeSince(new Date(message.created_at))}</span>
                    `;
                    if (message.sender_id === currentUser.id) {
                        messageDiv.classList.add('sent');
                    }
                    pageContainer.prepend(messageDiv);
                });
                chatcontainer.prepend(pageContainer);
            } else {
                console.error('No messages found');
                return;
            }
        })
        .catch((error) => {
            console.error('Error fetching messages:', error);
        });
    }

    sendMessage(recipientId) {
        const messageInput = document.getElementById('messageInput');
        var message = messageInput.value.trim();
        message = sanitizeInput(message);
        const userDiv = document.querySelector(`[data-user-id="${recipientId}"]`);
        
        // Check if user is offline before attempting to send
        if (userDiv && userDiv.querySelector('.fas.fa-dot-circle.offline')) {
            Toastr.error('Cannot send message to offline users');
            return;
        }
        if (message === "") return;
    
        const queryParams = new URLSearchParams({ messageInput: message });
        const url = `/chats/${recipientId}?${queryParams.toString()}`;
        fetchAPI(url, 'POST')
        .then(() => {
                // Message sent successfully
                Toastr.success('Message sent successfully');
        })
        .catch(error => {
            console.error('Error sending message:', error);
            Toastr.error('Error sending message');
        });
    }
}