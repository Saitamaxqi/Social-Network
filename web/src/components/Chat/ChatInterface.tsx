'use client'; // This directive ensures the component runs on the client side

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
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
  // Access WebSocket connection from context
  const { socket } = useWebSocket();

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
          const newMessages = data.filter(msg => !existingMessageIds.has(msg.id));
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

  /**
   * Handle WebSocket messages for real-time chat
   */
  useEffect(() => {
    if (!socket || !currentUser || !selectedUser) return;

    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        // Handle different types of WebSocket messages
        if (data.type === 'message') {
          console.log('Message type detected, current user:', currentUser?.id, 'selected user:', selectedUser?.id);
          console.log('Message sender:', data.sender?.id, 'recipient:', data.recipient?.id);
          
          // Force refresh messages when a new message is received
          if (currentUser && selectedUser) {
            // Handle case where recipient might be null in the message
            // If recipient is null, we need to determine if this message is for the current chat
            // based on the sender information alone
            let isRelevantMessage = false;
            
            if (data.recipient === null) {
              // If recipient is null, check if sender matches either the current user or selected user
              isRelevantMessage = data.sender && (
                data.sender.id === currentUser.id || 
                data.sender.id === selectedUser.id
              );
              console.log('Recipient is null, determining relevance based on sender:', isRelevantMessage);
            } else {
              // Normal case - check both sender and recipient
              isRelevantMessage = (
                (data.sender && data.sender.id === currentUser.id && data.recipient && data.recipient.id === selectedUser.id) ||
                (data.sender && data.sender.id === selectedUser.id && data.recipient && data.recipient.id === currentUser.id)
              );
              console.log('Normal message relevance check:', isRelevantMessage);
            }
            
            console.log('Is relevant message:', isRelevantMessage);
            
            if (isRelevantMessage) {
              console.log('Relevant message received:', data);
              
              // Create a properly formatted message object with safe handling for null recipient
              const newMessage: Message = {
                id: Date.now(), // Generate a unique ID for the message
                content: data.message,
                sender_id: data.sender.id,
                // Use selectedUser's ID as recipient_id if recipient is null and sender is currentUser
                // Otherwise use currentUser's ID
                recipient_id: data.recipient ? data.recipient.id : 
                  (data.sender.id === currentUser.id ? selectedUser.id : currentUser.id),
                created_at: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
                sender: {
                  id: data.sender.id,
                  username: data.sender.username
                },
                recipient: {
                  // If recipient is null, use the selectedUser or currentUser based on sender
                  id: data.recipient ? data.recipient.id : 
                    (data.sender.id === currentUser.id ? selectedUser.id : currentUser.id),
                  username: data.recipient ? data.recipient.username : 
                    (data.sender.id === currentUser.id ? selectedUser.username : currentUser.username)
                }
              };
              
              console.log('Adding new message to chat:', newMessage);
            
              // Add the new message to the chat - use a direct state update
              // Use a callback function to ensure we're working with the latest state
              console.log('About to update messages with new message:', newMessage);
              
              // Force a synchronous update to ensure the message is added immediately
              setMessages(prev => {
                // Check if message already exists to avoid duplicates
                const messageExists = prev.some((msg) => 
                  msg.content === newMessage.content && 
                  msg.sender_id === newMessage.sender_id &&
                  Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000
                );
                
                if (messageExists) {
                  console.log('Message already exists, not adding duplicate');
                  return prev;
                }
                
                console.log('Adding message to chat history, current count:', prev.length);
                // Create a completely new array to ensure React detects the change
                const updatedMessages = [...prev, newMessage];
                console.log('New messages count:', updatedMessages.length);
                console.log('Updated messages:', updatedMessages);
                
                // Return the new array to trigger a re-render
                return updatedMessages;
              });
              
              // Log the current messages state to verify the update
              setTimeout(() => {
                console.log('Current messages state after update:', messages.length);
              }, 10);
            
              // Scroll to bottom when receiving a new message
              setTimeout(() => {
                if (messagesContainerRef.current) {
                  messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                }
              }, 100);
            }
          }
        } else if (data.type === 'user_status') {
          // Update online status of users
          setOnlineUsers(prev => ({
            ...prev,
            [data.username]: data.status === 'online'
          }));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        console.error('Raw message data:', event.data);
      }
    };

    // Add event listener for incoming messages
    socket.addEventListener('message', handleWebSocketMessage);

    // Cleanup function to remove event listener
    return () => {
      socket.removeEventListener('message', handleWebSocketMessage);
    };
  }, [socket, currentUser, selectedUser]);

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
      console.log('Sending message to user:', selectedUser.id, 'content:', content);
      
      // Create a temporary message to show immediately in the UI
      const tempMessage: Message = {
        id: Date.now(), // Temporary ID
        content, // Use the content from the input directly
        sender_id: currentUser.id,
        recipient_id: selectedUser.id,
        created_at: new Date().toISOString(),
        sender: currentUser,
        recipient: selectedUser,
      };
      
      console.log('Adding temporary message to UI:', tempMessage);
      
      // Add the temporary message to the UI immediately for better UX
      setMessages(prev => {
        console.log('Current messages before adding temp:', prev.length);
        const newMessages = [...prev, tempMessage];
        console.log('New messages count with temp:', newMessages.length);
        return newMessages;
      });
      
      // Scroll to bottom after adding a new message
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
      
      // Send the message to the server
      console.log('Sending API request to server...');
      const response = await fetch(`/api/chats/${selectedUser.id}?messageInput=${encodeURIComponent(content)}`, {
        method: 'POST',
        credentials: 'include', // Include cookies in the request
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      console.log('Message sent successfully to server, waiting for WebSocket confirmation');
      // The actual message will come back through WebSocket
      // We've already shown a temporary version for better UX
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      
      // Remove the temporary message if sending failed
      setMessages(prev => prev.filter(msg => 
        !(msg.content === content && 
          msg.sender_id === currentUser.id && 
          msg.recipient_id === selectedUser.id &&
          new Date(msg.created_at).getTime() > Date.now() - 10000)
      ));
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
