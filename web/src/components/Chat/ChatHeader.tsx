'use client'; // This directive ensures the component runs on the client side

import React from 'react';
import './Chat.css'; // Import the chat styling

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
 * Props for the ChatHeader component
 * @property {User | null} recipient - The user this chat is with, null if no user selected
 * @property {boolean} isOnline - Whether the recipient is currently online
 */
interface ChatHeaderProps {
  recipient: User | null;
  isOnline: boolean;
}

/**
 * ChatHeader Component
 * 
 * Displays the header section of a chat conversation, including:
 * - Recipient's avatar (first letter of their username)
 * - Online/offline status indicator
 * - Recipient's username
 * - Message if no conversation is selected
 * 
 * @param {User | null} recipient - The user being chatted with
 * @param {boolean} isOnline - Whether the recipient is currently online
 */
const ChatHeader: React.FC<ChatHeaderProps> = ({ recipient, isOnline }) => {
  // If no recipient is selected, show a placeholder message
  if (!recipient) {
    return (
      <div className="chat-header">
        <div className="text-white opacity-70">Select a conversation</div>
      </div>
    );
  }

  // Render the chat header with recipient information
  return (
    <div className="chat-header">
      {/* Avatar section with online/offline status indicator */}
      <div className="relative">
        <div className="user-avatar">
          {/* Display first letter of username as avatar */}
          {recipient.username.charAt(0).toUpperCase()}
        </div>
        {/* Online/offline status indicator that changes color based on status */}
      </div>
      
      {/* User information section */}
      <div>
        <div className="font-medium text-white">{recipient.username}</div>
      </div>
    </div>
  );
};

export default ChatHeader;
