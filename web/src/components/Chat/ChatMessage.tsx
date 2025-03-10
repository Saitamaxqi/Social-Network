'use client'; // This directive ensures the component runs on the client side

import React from 'react';
import './Chat.css'; // Import the chat styling



/**
 * Props for the ChatMessage component
 * @property {string} content - The actual text content of the message
 * @property {boolean} sentByMe - Whether the current user sent this message
 * @property {string} timestamp - ISO string representing when message was sent
 * @property {string} senderName - Optional name of sender (shown for received messages)
 */
interface ChatMessageProps {
  content: string;
  sentByMe: boolean;
  timestamp: string;
  senderName?: string;
}

/**
 * ChatMessage Component
 * 
 * Renders an individual chat message bubble with appropriate styling.
 * Features:
 * - Different styling for sent vs. received messages
 * - Shows sender name for received messages
 * - Formats timestamp to show only hours and minutes
 * - Messages sent by current user appear on the right side
 * - Messages from others appear on the left side
 * 
 * @param {string} content - The message text content
 * @param {boolean} sentByMe - Whether this message was sent by the current user
 * @param {string} timestamp - When the message was sent (ISO string)
 * @param {string} senderName - Name of the sender (for received messages)
 */
const ChatMessage: React.FC<ChatMessageProps> = ({ 
  content, 
  sentByMe, 
  timestamp,
  senderName 
}) => {
  /**
   * Formats a timestamp string to a readable time format (HH:MM)
   * 
   * @param {string} dateString - ISO date string to format
   * @returns {string} Formatted time string (e.g., "14:32")
   */
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      // If there's any error parsing the date, return current time
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    // Apply different styling based on whether message was sent by current user
    <div className={`message ${sentByMe ? 'message-sent' : 'message-received'}`}>
      {/* Only show sender name for received messages when available */}
      {!sentByMe && senderName && (
        <div className="text-xs font-medium opacity-80 mb-1">{senderName}</div>
      )}
      
      {/* Message content */}
      <div>
        {content}
      </div>
      
      {/* Formatted timestamp */}
      <div className="message-time">{formatTime(timestamp)}</div>
    </div>
  );
};

export default ChatMessage;
