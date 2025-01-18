import { Post } from "./components/post.js";
import { DmsComponent, NotificationComponent } from "./components.js";
import {currentUser} from "./state.js";
import { timeSince } from "./utils.js";
import { MessageNumber } from "./state.js";
import { navigate } from "./router.js";
export class WebSocketClient {
    constructor(postInstance) {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        this.socket = new WebSocket(`${wsProtocol}${window.location.host}/ws`);
        this.socket.onmessage = this.handleMessage.bind(this);
        this.socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };
        
        this.socket.onclose = (event) => {
            console.log('WebSocket Closed:', event.code, event.reason);
        };
        this.postInstance = postInstance;
        this.container = null;
        this.defaultDuration = 3000; // milliseconds
        this.init();
        this.success = this.success;
        this.navigate = navigate;
        this.close = this.close;
        this.typingTimeout = null;
        this.isTyping = false;
    }

    handleMessage(event) {
        // console.log('Received message:', event.data);
        const data = JSON.parse(event.data);
        console.log('New data:', data);
        switch (data.type) {
            case 'new_post':
                console.log('New post received:', data.post);
                if (window.location.pathname == '/posts') {
                    var post = this.postInstance.createPostElement(data.post);
                    var cardContainer = document.getElementById('card-container');
                    if (!cardContainer) {
                        cardContainer = document.createElement('div');
                        cardContainer.id = 'card-container';
                        cardContainer.classList.add('card-container');
                        this.postInstance.content.appendChild(cardContainer);
                    }
                    cardContainer.prepend(post);
                    break;
                }

            case 'user_typing':
                if (data.recipientId == currentUser.id ) {
                    this.showTypingIndicator(data.senderId);
                    // console.log('User is typing:', data.recipientId);
                    break;
                }
            case 'user_stopped_typing':
                if (data.recipientId == currentUser.id ) {
                     this.removeTypingIndicator(data.senderId);
                    // console.log('User stopped typing:', data.recipientId);
                    break;
                }
            case 'new_comment':
                console.log('New comment received:', data.comment);
                //check current path if its in post page includes posts/id
                if (window.location.pathname.match(/^\/posts\/\d+$/)) {
                var content = document.getElementById('content');
                content.innerHTML = '';
                var id = window.location.pathname.split('/').pop();
                this.postInstance.renderPost(id);
                break;
                }
            case 'post_interaction':
                console.log('New post intraction received:', data.comment);
                //check current path if its in post page includes posts/id
                if (window.location.pathname.match(/^\/posts\/\d+$/)) {
                var content = document.getElementById('content');
                content.innerHTML = '';
                //get the id from path
                var id = window.location.pathname.split('/').pop();
                this.postInstance.renderPost(id);
                break;
                }
                case 'user status':
                    console.log('New user status received');
                    // var content = document.getElementById('content');
                    // content.innerHTML = '';
                    this.postInstance.renderDms();
                    break;
                case 'notification':
                    if (data.notification.type === 'message' && data.notification.user_id === currentUser.id) {
                        setTimeout(() => {
                            DmsComponent.renderDms();
                        }, 2000);
                        this.success(data.notification.text,this.defaultDuration, data.notification.link_id);
                    }
                    console.log(data);
                    if (data.notification.user_id === currentUser.id) {
                 NotificationComponent.startGettingNotifications();
                    }
                    if (data.notification.user_id === currentUser.id && window.location.pathname === '/notifications') {
                        NotificationComponent.renderNotifications();
                        break;
                               }
                case 'message':
                                if (data.sender && data.sender.id === currentUser.id) {
                                    var CurrentNumber = localStorage.getItem('MessageNumber');
if (CurrentNumber % 2 === 0){
    //update MessageNumber in local storage + 1
    console.log(CurrentNumber);
    localStorage.setItem('MessageNumber', parseInt(CurrentNumber,10) + 1);
    this.handleChatMessage(data);
    //make this function be called after 2 sec renderDms
    setTimeout(() => {
        DmsComponent.renderDms();
    }, 2000);
} else {
    console.log(CurrentNumber);
    localStorage.setItem('MessageNumber', parseInt(CurrentNumber,10) + 1);
    //skip the message
}
                                }
        if (data.recipient && data.sender && data.recipient.id === currentUser.id && window.location.pathname === '/chat/'+ data.sender.id) {
            var CurrentNumber = localStorage.getItem('MessageNumber');
            if (CurrentNumber % 2 === 0){
                //update MessageNumber in local storage + 1
                console.log(CurrentNumber);
                localStorage.setItem('MessageNumber', parseInt(CurrentNumber,10) + 1);
                this.handleChatMessage(data);
                setTimeout(() => {
                    DmsComponent.renderDms();
                }, 2000);
            } else {
                console.log(CurrentNumber);
                localStorage.setItem('MessageNumber', parseInt(CurrentNumber,10) + 1);
                //skip the message
            }
                                }
        }
    }
     handleChatMessage(data) {
        const chatContainer = document.querySelector('.chat-container');
        const pages = chatContainer.querySelectorAll('.page');
        const lastPage = pages[pages.length - 1];
        
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.innerHTML = `
            <span class="username">${data.sender.username}</span>
            <span class="message-content">${data.message}</span>
            <span class="time">${timeSince(new Date(data.created_at))}</span>
        `;
        if (data.sender.id === currentUser.id) {
            messageDiv.classList.add('sent');
        }
        if (lastPage && lastPage.children.length < 10) {
            lastPage.appendChild(messageDiv);
            // console.log('if');
        } else {
            const newPage = document.createElement('div');
            newPage.classList.add('page');
            newPage.appendChild(messageDiv);
            chatContainer.appendChild(newPage);
             var page = parseInt(localStorage.getItem('page'),10) + 1
            localStorage.setItem('page', page.toString());
            // console.log('else');
        }
    }

    show(message, type = 'default', duration = this.defaultDuration, link) {
        const toastr = document.createElement('div');
        toastr.className = `toastr toastr-${type}`;
        toastr.innerHTML = `
            <span>${message}</span>
            <button class="toastr-close">&times;</button>
        `;
        toastr.addEventListener('click', () => {
            this.navigate(`chat/${link}`);
        })

        this.container.appendChild(toastr);

        // Trigger reflow to enable transition
        toastr.offsetHeight;

        toastr.classList.add('show');

        const closeBtn = toastr.querySelector('.toastr-close');
        closeBtn.addEventListener('click', () => this.close(toastr));

        if (duration > 0) {
            setTimeout(() => this.close(toastr), duration);
        }
    }

    success(message, duration, link) {
        this.show(message, 'success', duration, link);
    }
    close(toastr) {
        toastr.classList.remove('show');
        toastr.addEventListener('transitionend', () => {
            toastr.remove();
        });
    }

    init() {
        this.container = document.createElement('div');
        this.container.id = 'toastr-container';
        document.body.appendChild(this.container);

        const style = document.createElement('style');

        document.head.appendChild(style);
    }

    handleTyping(senderId,recipientId) {
        if (!this.isTyping) {
            this.isTyping = true;
            this.socket.send(JSON.stringify({
                type: 'user_typing',
                senderId: senderId,
                recipientId: recipientId
            }));
        }
    
        // Clear existing timeout
        clearTimeout(this.typingTimeout);
    
        // Set new timeout
        this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
            this.socket.send(JSON.stringify({
                type: 'user_stopped_typing',
                senderId: senderId
            }));
        }, 1000); // Stop typing indicator after 1 second of no input
    }
    showTypingIndicator(userId) {
        const userDiv = document.querySelector(`[data-user-id="${userId}"]`); 
        console.log('userDiv:', userDiv);
        if (!userDiv) return;
    
        // Remove existing typing indicator if any
        const existingIndicator = userDiv.querySelector('.typing');
        if (existingIndicator) return;
    
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing';
        typingDiv.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
       
        console.log('appended');
        userDiv.appendChild(typingDiv);
    }
    
    // Add this method to remove the indicator
    removeTypingIndicator(userId) {
        const userDiv = document.querySelector(`[data-user-id="${userId}"]`);
        if (!userDiv) return;
    
        const typingDiv = userDiv.querySelector('.typing');
        if (typingDiv) {
            typingDiv.remove();
        }
    }
 
}