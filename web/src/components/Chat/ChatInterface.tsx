'use client'; // This directive ensures the component runs on the client side

import React, { useState, useEffect, useCallback } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import './Chat.css';

/**
 * Message interface representing the structure of a chat message
 * @property {number} id - Unique identifier for the message
 * @property {string} content - The text content of the message
 * @property {number} sender_id - ID of the user who sent the message
 * @property {number} recipient_id - ID of the user who received the message
 * @property {string} created_at - ISO timestamp when the message was sent
 * @property {object} sender - User object representing the sender
 * @property {object} recipient - User object representing the recipient
 */
interface Message {
  id: number;
  content: string;
  sender_id: number;
  recipient_id: number;
  created_at: string;
  sender: {
    id: number;
    username: string;
  };
  recipient: {
    id: number;
    username: string;
  };
}

/**
 * User interface representing the structure of a user object
 * @property {number} id - Unique identifier for the user
 * @property {string} username - Display name of the user
 */
interface User {
  id: number;
  username: string;
}

/**
 * ChatInterface Component
 * 
 * This is the main component that integrates all chat subcomponents:
 * - ChatSidebar: Shows list of recent chats
 * - ChatHeader: Shows information about the current chat
 * - Messages area: Displays the messages for the selected chat
 * - ChatInput: Allows sending new messages
 * 
 * Features:
 * - Select different users to chat with
 * - View chat history with pagination
 * - Send new messages
 * - Real-time updates (via WebSocket - to be implemented)
 * - Shows online/offline status of users
 */
const ChatInterface: React.FC = () => {
  // State for storing the currently selected user
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // State for tracking which users are online
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  // State for storing messages in the current chat
  const [messages, setMessages] = useState<Message[]>([]);
  // Loading state for fetching messages
  const [loadingMessages, setLoadingMessages] = useState(false);
  // Current authenticated user
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Pagination - current page of messages
  const [page, setPage] = useState(0);
  // Whether there are more messages to load
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  /**
   * Fetches the current authenticated user info
   */
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // Use the correct endpoint as defined in the backend
        const response = await fetch('/api/login-session', {
          credentials: 'include' // Include cookies in the request
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data); // Backend directly returns the user object
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  /**
   * Fetches chat messages when a user is selected
   * Loads messages in pages for pagination
   */
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);
        const response = await fetch(`/api/chats/${selectedUser.id}?page=${page}`, {
          credentials: 'include' // Include cookies in the request
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        
        const data = await response.json();
        
        // If there are no new messages or fewer than the page size, we've reached the end
        if (data.length === 0 || data.length < 10) {
          setHasMoreMessages(false);
        }
        
        // Append new messages to existing ones for pagination
        setMessages(prev => [...prev, ...data]);
        setLoadingMessages(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setLoadingMessages(false);
      }
    };

    // Reset messages when changing users
    if (selectedUser && page === 0) {
      setMessages([]);
      setHasMoreMessages(true);
    }

    fetchMessages();
  }, [selectedUser, page]);

  /**
   * Handles user selection from the sidebar
   * @param {number} userId - ID of the selected user
   */
  const handleSelectUser = useCallback((userId: number) => {
    // Reset pagination when changing users
    setPage(0);
    setHasMoreMessages(true);
    
    // Fetch user details and set as selected user
    const fetchUserDetails = async () => {
      try {
        // Use the profile endpoint instead of users endpoint which requires admin privileges
        const response = await fetch(`/api/profile/${userId}`, {
          credentials: 'include' // Include cookies in the request
        });
        if (response.ok) {
          const user = await response.json();
          setSelectedUser(user);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, []);

  /**
   * Loads more messages when scrolling up
   * Increments the page counter to fetch the next batch
   */
  const loadMoreMessages = useCallback(() => {
    if (!loadingMessages && hasMoreMessages) {
      setPage(prev => prev + 1);
    }
  }, [loadingMessages, hasMoreMessages]);

  /**
   * Sends a new message to the selected user
   * @param {string} content - Text content of the message
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!selectedUser || !content.trim() || !currentUser) return;

    try {
      const response = await fetch(`/api/chats/${selectedUser.id}?messageInput=${encodeURIComponent(content)}`, {
        method: 'POST',
        credentials: 'include', // Include cookies in the request
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Optimistically add the message to the UI
      const newMessage: Message = {
        id: Date.now(), // Temporary ID
        content,
        sender_id: currentUser.id,
        recipient_id: selectedUser.id,
        created_at: new Date().toISOString(),
        sender: currentUser,
        recipient: selectedUser,
      };

      setMessages(prev => [newMessage, ...prev]);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  }, [selectedUser, currentUser]);

  /**
   * Checks if a message was sent by the current user
   * @param {Message} message - The message to check
   * @returns {boolean} True if the message was sent by the current user
   */
  const isMessageFromMe = useCallback((message: Message) => {
    return currentUser?.id === message.sender_id;
  }, [currentUser]);

  return (
    <div className="chat-container flex h-full">
      {/* Sidebar with recent chats */}
      <ChatSidebar 
        selectedUserId={selectedUser?.id || null} 
        onSelectUser={handleSelectUser} 
      />

      {/* Main chat area */}
      <div className="chat-content flex-1">
        {/* Show chat header with recipient info if a user is selected */}
        <ChatHeader 
          recipient={selectedUser} 
          isOnline={selectedUser ? onlineUsers[selectedUser.username] || false : false} 
        />

        {/* Display chat messages or empty state */}
        {selectedUser ? (
          <div className="chat-messages">
            {/* Load more messages button */}
            {hasMoreMessages && (
              <button 
                onClick={loadMoreMessages}
                disabled={loadingMessages}
                className="mb-4 p-2 bg-white/10 rounded text-white text-sm w-full"
              >
                {loadingMessages ? 'Loading...' : 'Load older messages'}
              </button>
            )}
            
            {/* Display messages */}
            {messages.length > 0 ? (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  content={message.content}
                  sentByMe={isMessageFromMe(message)}
                  timestamp={message.created_at}
                  senderName={!isMessageFromMe(message) ? message.sender.username : undefined}
                />
              ))
            ) : (
              <div className="empty-state text-white/70">
                {loadingMessages ? (
                  <div className="animate-pulse">Loading messages...</div>
                ) : (
                  <div>
                    <div className="text-lg mb-2">No messages yet</div>
                    <div className="text-sm">Send a message to start the conversation!</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state text-white/70">
            <div className="text-lg mb-2">Select a conversation</div>
            <div className="text-sm">Choose a user from the sidebar to start chatting</div>
          </div>
        )}

        {/* Chat input field - only shown when a user is selected */}
        {selectedUser && (
          <ChatInput 
            onSendMessage={sendMessage} 
            disabled={loadingMessages} 
          />
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
