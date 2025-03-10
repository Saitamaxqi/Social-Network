'use client'; // This directive ensures the component runs on the client side

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWebSocket } from '@/contexts/WebSocketContext';
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
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get('userId');
  const { socket } = useWebSocket();
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
  // Reference to the chat messages container for auto-scrolling
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  // Flag to track if we're loading older messages (pagination)
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);

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
        
        // For pagination, we need to add older messages at the beginning
        // Filter out any duplicate messages that might already exist in the current messages array
        setMessages(prev => {
          const existingMessageIds = new Set(prev.map(msg => msg.id));
          const newMessages = data.filter((msg : Message) => !existingMessageIds.has(msg.id));
          return [...newMessages, ...prev];
        });
        setLoadingMessages(false);
        
        // If this is the first page (initial load), scroll to bottom
        if (page === 0) {
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
          }, 200); // Increased timeout to ensure rendering is complete
        }
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
   * Scroll to bottom when messages change, except when loading older messages
   */
  useEffect(() => {
    if (messages.length > 0 && !loadingOlderMessages) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 200);
    }
    // Reset the loading older messages flag after messages are updated
    setLoadingOlderMessages(false);
  }, [messages, loadingOlderMessages]);

  // Handle incoming websocket messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      // Handle chat messages
      if (data.type === 'message' && data.message && currentUser) {
        const newMessage: Message = {
          id: Date.now(), // Temporary ID for new messages
          content: data.message.content,
          sender_id: data.message.sender.id,
          recipient_id: currentUser.id,
          created_at: data.message.created_at,
          sender: {
            id: data.message.sender.id,
            username: data.message.sender.username
          },
          recipient: {
            id: currentUser.id,
            username: currentUser.username
          }
        };

        // Only add message if it's from the currently selected user
        if (selectedUser && (newMessage.sender_id === selectedUser.id)) {
          setMessages(prev => [...prev, newMessage]);
        }
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, selectedUser, currentUser]);

  /**
   * Fetch user details when userId changes in URL
   */
  useEffect(() => {
    if (!userIdParam) return;
    
    const userId = parseInt(userIdParam);
    if (isNaN(userId)) return;
    
    // Reset pagination when changing users
    setPage(0);
    setHasMoreMessages(true);
    // Reset messages when changing users
    setMessages([]);
    
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
  }, [userIdParam]);

  /**
   * Loads more messages when scrolling up
   * Increments the page counter to fetch the next batch
   */
  const loadMoreMessages = useCallback(() => {
    if (!loadingMessages && hasMoreMessages) {
      setLoadingOlderMessages(true);
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
      
      // Create a valid temporary message first to ensure we have something to display immediately
      const tempMessage: Message = {
        id: Date.now(), // Temporary ID
        content, // Use the content from the input directly
        sender_id: currentUser.id,
        recipient_id: selectedUser.id,
        created_at: new Date().toISOString(),
        sender: currentUser,
        recipient: selectedUser,
      };
      
      // Add the temporary message to the UI immediately
      setMessages(prev => [...prev, tempMessage]);
      
      // Try to get the actual message from the response
      try {
        const responseData = await response.json();
        // We'll update the message when we get the server response, but we won't display it again
        // The server-side message will be fetched on the next refresh or message load
      } catch (e) {
        console.log('Could not parse server response, using temporary message');
        // We already added the temporary message, so no need to do anything here
      }

      // We've already added the message to the UI above, so we don't need to do it again here
      
      // Scroll to bottom after adding a new message
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 200); // Increased timeout to ensure rendering is complete
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
      {/* Main chat area */}
      <div className="chat-content flex-1">
        {/* Show chat header with recipient info if a user is selected */}
        <ChatHeader 
          recipient={selectedUser} 
          isOnline={selectedUser ? onlineUsers[selectedUser.username] || false : false} 
        />

        {/* Display chat messages or empty state */}
        {selectedUser ? (
          <div className="chat-messages" ref={messagesContainerRef}>
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
              // Sort messages by timestamp to ensure chronological order
              [...messages]
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map((message, index) => (
                  <ChatMessage
                    key={`${message.id}-${index}`}
                    content={message.content}
                    sentByMe={isMessageFromMe(message)}
                    timestamp={message.created_at}
                    senderName={!isMessageFromMe(message) && message.sender ? message.sender.username : undefined}
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
            <div className="text-lg mb-2">No conversation selected</div>
            <div className="text-sm">Click on a chat icon next to a user in the right sidebar to start chatting</div>
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
