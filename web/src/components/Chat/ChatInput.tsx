'use client'; // This directive ensures the component runs on the client side

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import './Chat.css'; // Import the chat styling

// Dynamically import EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => <div className="text-white text-xs">Loading...</div>
});

import { EmojiClickData } from 'emoji-picker-react';

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
  // State to toggle emoji picker visibility
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // Ref for the emoji picker container to handle outside clicks
  const emojiPickerRef = useRef<HTMLDivElement>(null);

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
      setShowEmojiPicker(false); // Hide emoji picker after sending
    }
  };
  
  /**
   * Handles emoji selection from the emoji picker
   * @param {EmojiClickData} emojiData - Data about the selected emoji
   */
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji);
  };
  
  /**
   * Toggles the emoji picker visibility
   */
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(prev => !prev);
  };
  
  /**
   * Effect to handle clicks outside the emoji picker to close it
   */
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="chat-input">
        {/* Emoji button */}
        <button 
          type="button" 
          onClick={toggleEmojiPicker}
          className="emoji-button rounded-full p-2 mr-2 bg-gray-700 hover:bg-gray-600"
        >
          <span role="img" aria-label="emoji" className="text-xl">😊</span>
        </button>
        
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
      
      {/* Emoji picker popup */}
      {showEmojiPicker && (
        <div 
          ref={emojiPickerRef}
          className="absolute bottom-16 left-0 z-10"
        >
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
};

export default ChatInput;
