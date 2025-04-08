'use client';

import React, { useState, useRef, useEffect } from 'react';
import './Chat.css';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  
  // Character limit for messages
  const MESSAGE_CHAR_LIMIT = 500;

  // Expanded emoji set organized by categories
  const emojiCategories = {
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
    emotions: ['😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭'],
    gestures: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
    hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊'],
    food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🌮', '🍕', '🍔', '🍟', '🍩', '🍦'],
    activities: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🏒', '🏑', '🥎', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤸', '🤼', '🤹', '🎮', '🎯', '🎲'],
    travel: ['✈️', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍️', '🚂', '🚆', '🚇', '🚊', '🚉', '🚁'],
    objects: ['💻', '⌨️', '🖥️', '🖱️', '🖨️', '📱', '☎️', '📞', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '📡', '🔋', '🔌', '💡', '🔦', '🕯️'],
    symbols: ['❗', '❕', '❓', '❔', '‼️', '⁉️', '💯', '✅', '❌', '⭕', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲']
  };

  // Currently selected emoji category
  const [currentCategory, setCurrentCategory] = useState<keyof typeof emojiCategories>('smileys');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !disabled && message.length <= MESSAGE_CHAR_LIMIT) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const addEmoji = (emoji: string) => {
    if (message.length < MESSAGE_CHAR_LIMIT) {
      setMessage(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', width: '100%' }}>
      {/* Emoji button and picker */}
      <div style={{ position: 'relative' }} ref={emojiPickerRef}>
        <button 
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          <span style={{ fontSize: '20px' }}>😊</span>
        </button>

        {/* Emoji picker dropdown */}
        {showEmojiPicker && (
          <div style={{
            position: 'absolute',
            bottom: '50px',
            left: '0',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            padding: '10px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1001,
            width: '320px',
            maxHeight: '350px',
            overflowY: 'auto'
          }}>
            {/* Category selector */}
            <div style={{ 
              display: 'flex', 
              overflowX: 'auto', 
              marginBottom: '10px',
              padding: '5px 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <button
                type="button"
                onClick={() => setCurrentCategory('smileys')}
                style={{
                  backgroundColor: currentCategory === 'smileys' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px',
                  marginRight: '5px',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                😊
              </button>
              <button
                type="button"
                onClick={() => setCurrentCategory('emotions')}
                style={{
                  backgroundColor: currentCategory === 'emotions' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px',
                  marginRight: '5px',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                😢
              </button>
              <button
                type="button"
                onClick={() => setCurrentCategory('gestures')}
                style={{
                  backgroundColor: currentCategory === 'gestures' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px',
                  marginRight: '5px',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                👍
              </button>
              <button
                type="button"
                onClick={() => setCurrentCategory('hearts')}
                style={{
                  backgroundColor: currentCategory === 'hearts' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px',
                  marginRight: '5px',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                ❤️
              </button>
              <button
                type="button"
                onClick={() => setCurrentCategory('animals')}
                style={{
                  backgroundColor: currentCategory === 'animals' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px',
                  marginRight: '5px',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                🐱
              </button>
              <button
                type="button"
                onClick={() => setCurrentCategory('food')}
                style={{
                  backgroundColor: currentCategory === 'food' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px',
                  marginRight: '5px',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                🍕
              </button>
              <button
                type="button"
                onClick={() => setCurrentCategory('activities')}
                style={{
                  backgroundColor: currentCategory === 'activities' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px',
                  marginRight: '5px',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                🎮
              </button>
              <button
                type="button"
                onClick={() => setCurrentCategory('objects')}
                style={{
                  backgroundColor: currentCategory === 'objects' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px',
                  marginRight: '5px',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                💻
              </button>
            </div>

            {/* Emoji grid for selected category */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '5px'
            }}>
              {emojiCategories[currentCategory].map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '20px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, position: 'relative', marginRight: '10px' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => {
            if (e.target.value.length <= MESSAGE_CHAR_LIMIT) {
              setMessage(e.target.value);
            }
          }}
          placeholder="Type a message..."
          disabled={disabled}
          maxLength={MESSAGE_CHAR_LIMIT}
          style={{
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '20px',
            padding: '10px 15px',
            color: 'white'
          }}
        />
        <div style={{
          position: 'absolute',
          right: '10px',
          bottom: '-20px',
          fontSize: '12px',
          color: message.length > MESSAGE_CHAR_LIMIT * 0.9 ? '#f87171' : 'rgba(255, 255, 255, 0.5)'
        }}>
          {message.length}/{MESSAGE_CHAR_LIMIT}
        </div>
      </div>
      
      <button 
        type="submit" 
        disabled={!message.trim() || disabled}
        style={{
          backgroundColor: message.trim() && !disabled ? '#2563eb' : 'rgba(37, 99, 235, 0.5)',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: message.trim() && !disabled ? 'pointer' : 'not-allowed'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </form>
  );
};

export default ChatInput;
