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
 * @property {number} recipient_id - ID of the user who received the message (for direct messages)
 * @property {number} group_id - ID of the group (for group messages)
 * @property {string} created_at - ISO timestamp when the message was sent
 * @property {object} sender - User object representing the sender
 * @property {object} recipient - User object representing the recipient (for direct messages)
 * @property {object} group - Group object representing the group (for group messages)
 */
interface Message {
  id: number;
  content: string;
  sender_id: number;
  recipient_id?: number;
  group_id?: number;
  created_at: string;
  sender: {
    id: number;
    username: string;
  };
  recipient?: {
    id: number;
    username: string;
  };
  group?: {
    id: number;
    title: string;
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
 * Group interface representing the structure of a group object
 * @property {number} id - Unique identifier for the group
 * @property {string} title - Name of the group
 * @property {string} description - Description of the group
 */
interface Group {
  id: number;
  title: string;
  description?: string;
  creator_id?: number;
  created_at?: string;
  members?: Array<{id: number, username: string}>;
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
  const url = window.location.pathname;
  //if were in group
  let groupIdParam = null;
  if(url.includes('groups')){
    groupIdParam = url.split('/').pop();
  }
  const { socket } = useWebSocket();
  // Chat type: 'direct' or 'group'
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct');
  // State for storing the currently selected user (for direct messages)
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // State for storing the currently selected group (for group chats)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
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
        const response = await fetch('/api/auth/session', {
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
   * Fetches chat messages based on chat type
   * Loads messages in pages for pagination
   */
  useEffect(() => {
    const fetchMessages = async () => {
      if (!userIdParam && !groupIdParam) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);
        let url = '';
        
        // Determine which API endpoint to use based on chat type
        if (chatType === 'direct' && userIdParam) {
          const userId = parseInt(userIdParam);
          url = `/api/chats/${userId}?page=${page}`;
        } else if (chatType === 'group' && groupIdParam) {
          const groupId = parseInt(groupIdParam);
          url = `/api/groups/${groupId}/messages?page=${page}`;
        } else {
          return;
        }
        
        const response = await fetch(url, {
          credentials: 'include' // Include cookies in the request
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        
        const data = await response.json();
        
        // Set the selected user or group from the response
        if (page === 0) {
          if (chatType === 'direct' && data.recipient) {
            setSelectedUser(data.recipient);
          } else if (chatType === 'group' && data.group) {
            // The backend now includes group info in the response
            setSelectedGroup(data.group);
          }
        }
        
        const messagesArray = data.messages || [];
        
        // If there are no new messages or fewer than the page size, we've reached the end
        if (messagesArray.length === 0 || messagesArray.length < 10) {
          setHasMoreMessages(false);
        }
        
        // For pagination, we need to add older messages at the beginning
        // Filter out any duplicate messages that might already exist in the current messages array
        setMessages(prev => {
          const existingMessageIds = new Set(prev.map(msg => msg.id));
          const newMessages = messagesArray.filter((msg : Message) => !existingMessageIds.has(msg.id));
          return [...newMessages, ...prev];
        });
        
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
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [userIdParam, groupIdParam, chatType, page]);

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
      console.log('WebSocket message received:', data);
      
      // Handle direct chat messages
      if (data.type === 'message' && data.message && currentUser) {
        const newMessage: Message = {
          id: Date.now(), // Temporary ID for new messages
          content: data.message.content,
          sender_id: data.message.sender.id,
          created_at: data.message.created_at,
          sender: {
            id: data.message.sender.id,
            username: data.message.sender.username
          }
        };

        // Add recipient_id for direct messages
        if (data.message.recipient_id) {
          newMessage.recipient_id = data.message.recipient_id;
          newMessage.recipient = {
            id: data.message.recipient_id,
            username: data.message.recipient?.username || ''
          };
        }
        
        // Add message if it's for the current direct chat
        if (chatType === 'direct' && selectedUser && 
            ((newMessage.sender_id === selectedUser.id && newMessage.recipient_id === currentUser.id) || 
             (newMessage.sender_id === currentUser.id && newMessage.recipient_id === selectedUser.id))) {
          console.log('Adding direct message to chat');
          setMessages(prev => [...prev, newMessage]);
          
          // Scroll to bottom when receiving a new message
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
          }, 100);
        }
      }
      
      // Handle group chat messages
      if (data.type === 'group_message' && data.message && currentUser) {
        console.log('Received group message:', data.message);
        
        const newMessage: Message = {
          id: Date.now(), // Temporary ID for new messages
          content: data.message.content,
          sender_id: data.message.sender.id,
          group_id: data.message.group_id,
          created_at: data.message.created_at,
          sender: {
            id: data.message.sender.id,
            username: data.message.sender.username
          },
          group: {
            id: data.message.group_id,
            title: data.message.group?.title || ''
          }
        };
        
        // Add message if it's for the current group chat
        if (chatType === 'group' && selectedGroup && newMessage.group_id === selectedGroup.id) {
          console.log('Adding group message to chat');
          setMessages(prev => [...prev, newMessage]);
          
          // Scroll to bottom when receiving a new message
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
          }, 100);
        } else {
          console.log('Group message not for current chat');
        }
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, selectedUser, selectedGroup, currentUser, chatType]);

  /**
   * Determine chat type and update state when URL parameters change
   */
  useEffect(() => {
    // Reset states when changing chats
    setPage(0);
    setHasMoreMessages(true);
    setMessages([]);
    
    if (groupIdParam) {
      // Group chat mode
      setChatType('group');
      setSelectedUser(null);
      const groupId = parseInt(groupIdParam);
      if (!isNaN(groupId)) {
        // We'll get the group details from the messages response
      } else {
        setSelectedGroup(null);
      }
    } else if (userIdParam) {
      // Direct chat mode
      setChatType('direct');
      setSelectedGroup(null);
      const userId = parseInt(userIdParam);
      if (isNaN(userId)) {
        setSelectedUser(null);
      }
      // We'll get the selected user from the messages response
    } else {
      // No chat selected
      setChatType('direct');
      setSelectedUser(null);
      setSelectedGroup(null);
    }
  }, [userIdParam, groupIdParam]);

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
   * Sends a new message based on chat type
   * @param {string} content - Text content of the message
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !currentUser) return;
    
    // Check if we have a valid recipient based on chat type
    if ((chatType === 'direct' && !selectedUser) || (chatType === 'group' && !selectedGroup)) {
      return;
    }

    try {
      let url = '';
      let tempMessage: Message;
      
      // Determine which API endpoint to use based on chat type
      if (chatType === 'direct' && selectedUser) {
        url = `/api/chats/${selectedUser.id}?messageInput=${encodeURIComponent(content)}`;
        
        // Create a temporary direct message
        tempMessage = {
          id: Date.now(), // Temporary ID
          content,
          sender_id: currentUser.id,
          recipient_id: selectedUser.id,
          created_at: new Date().toISOString(),
          sender: currentUser,
          recipient: selectedUser,
        };
      } else if (chatType === 'group' && selectedGroup) {
        url = `/api/groups/${selectedGroup.id}/messages`;
        
        // Create a temporary group message
        tempMessage = {
          id: Date.now(), // Temporary ID
          content,
          sender_id: currentUser.id,
          group_id: selectedGroup.id,
          created_at: new Date().toISOString(),
          sender: currentUser,
          group: selectedGroup,
        };
      } else {
        throw new Error('Invalid chat type or missing recipient');
      }
      
      // For direct messages, use GET with query params
      // For group messages, use POST with JSON body
      let response;
      if (chatType === 'direct') {
        response = await fetch(url, {
          method: 'POST',
          credentials: 'include', // Include cookies in the request
        });
      } else {
        // For group messages, send as JSON body
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messageInput: content }),
          credentials: 'include', // Include cookies in the request
        });
      }

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
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
  }, [chatType, selectedUser, selectedGroup, currentUser]);

  /**
   * Checks if a message was sent by the current user
   * @param {Message} message - The message to check
   * @returns {boolean} True if the message was sent by the current user
   */
  const isMessageFromMe = useCallback((message: Message) => {
    return currentUser?.id === message.sender_id;
  }, [currentUser]);

  return (
    <div className="chat-container" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat header - only for direct messages */}
      {chatType === 'direct' && selectedUser && (
        <div className="chat-header-container">
          <ChatHeader 
            recipient={selectedUser} 
            isOnline={onlineUsers[selectedUser.username] || false} 
          />
        </div>
      )}

      {/* Chat messages area */}
      <div className="chat-messages-area" style={{ flex: 1, overflowY: 'auto', paddingBottom: '70px' }}>
        {(selectedUser || selectedGroup) ? (
          <div className="chat-messages" ref={messagesContainerRef}>
            {hasMoreMessages && (
              <button 
                onClick={loadMoreMessages}
                disabled={loadingMessages}
                className="mb-4 p-2 bg-white/10 rounded text-white text-sm w-full"
              >
                {loadingMessages ? 'Loading...' : 'Load older messages'}
              </button>
            )}
            
            {messages.length > 0 ? (
              messages
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
      </div>

      {/* Chat input field */}
      {(selectedUser || selectedGroup) && (
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          width: '100%', 
          backgroundColor: '#1a1a1a',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '10px'
        }}>
          <ChatInput 
            onSendMessage={sendMessage} 
            disabled={loadingMessages} 
          />
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
