'use client'; // This directive ensures the component runs on the client side

import React, { useState } from 'react';
import './Chat.css'; // Import the chat styling

/**
 * Props for the ChatInput component
 * @property {function} onSendMessage - Callback function triggered when a message is sent
 * @property {boolean} disabled - Optional flag to disable the input (default: false)
 */
interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

/**
 * ChatInput Component
 * 
 * Renders a form with a text input and submit button for sending chat messages.
 * Features:
 * - Input validation to prevent sending empty messages
 * - Visual feedback for disabled state
 * - Clears input field after message is sent
 * 
 * @param {function} onSendMessage - Function to call when sending a message
 * @param {boolean} disabled - Whether the input should be disabled
 */
const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  // State to track the current message being typed
  const [message, setMessage] = useState('');

  /**
   * Handles the form submission event
   * Prevents default form submission, validates message content,
   * calls the onSendMessage callback, and resets the input field
   * 
   * @param {React.FormEvent} e - The form submission event
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page refresh on form submission
    
    // Only send if message is not empty and component is not disabled
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage(''); // Clear the input field after sending
    }
  };

  return (
    <form onSubmit={handleSubmit} className="chat-input">
      {/* Message input field */}
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
        className="bg-white/10 rounded-full px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      {/* Send button with dynamic styling based on state */}
      <button 
        type="submit" 
        disabled={!message.trim() || disabled}
        className={`rounded-full p-2 ${!message.trim() || disabled ? 'bg-blue-500/50 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
      >
        {/* Paper airplane icon for send button */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </form>
  );
};

export default ChatInput;
