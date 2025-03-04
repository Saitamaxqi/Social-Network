'use client'; // This directive ensures the component runs on the client side

import React, { useEffect, useState } from 'react';
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
 * Props for the ChatSidebar component
 * @property {number | null} selectedUserId - Currently selected user's ID
 * @property {function} onSelectUser - Callback function when a user is selected
 */
interface ChatSidebarProps {
  selectedUserId: number | null;
  onSelectUser: (userId: number) => void;
}

/**
 * ChatSidebar Component
 * 
 * Displays a sidebar with recent chat conversations.
 * Features:
 * - Shows list of users with recent chat history
 * - Displays online/offline status for each user
 * - Loading state with skeleton UI
 * - Error handling with user-friendly message
 * - Auto-refreshes chat list every minute
 * - Highlights the currently selected conversation
 * 
 * @param {number | null} selectedUserId - ID of currently selected user
 * @param {function} onSelectUser - Function to call when a user is selected
 */
const ChatSidebar: React.FC<ChatSidebarProps> = ({ selectedUserId, onSelectUser }) => {
  // State for storing the list of recent chat users
  const [recentChats, setRecentChats] = useState<User[]>([]);
  // State for tracking online status of each user
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  // Loading state for showing skeleton UI
  const [loading, setLoading] = useState(true);
  // Error state for handling API failures
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Fetches the list of recent chats and online status from the API
     * Updates state with the fetched data or sets error state if request fails
     */
    const fetchRecentChats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/chats', {
          credentials: 'include' // Include cookies in the request
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch recent chats');
        }
        
        const data = await response.json();
        // The backend returns { recentChats: [...], onlineUsers: {...} }
        setRecentChats(data.recentChats || []);
        setOnlineUsers(data.onlineUsers || {});
        setLoading(false);
      } catch (error) {
        console.error('Error fetching recent chats:', error);
        setError('Failed to load chats. Please try again later.');
        setLoading(false);
      }
    };

    // Initial fetch of chat data
    fetchRecentChats();
    
    // Set up periodic refresh of chat data (every minute)
    const interval = setInterval(fetchRecentChats, 60000);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, []); // Empty dependency array means this effect runs once on mount

  // Show loading UI while fetching data
  if (loading) {
    return (
      <div className="chat-sidebar bg-black/20 text-white p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Chats</h2>
        {/* Skeleton loading UI with animation */}
        <div className="animate-pulse flex flex-col gap-2">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-12 bg-white/10 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Show error message if fetch failed
  if (error) {
    return (
      <div className="chat-sidebar bg-black/20 text-white p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Chats</h2>
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  // Main sidebar UI with recent chats
  return (
    <div className="chat-sidebar bg-black/20 text-white">
      <h2 className="text-lg font-semibold p-4 border-b border-white/10">Recent Chats</h2>
      
      {/* Conditional rendering based on whether we have chat data */}
      {recentChats.length > 0 ? (
        <div className="overflow-y-auto max-h-[calc(100%-4rem)]">
          {/* Map through each user and render a chat item */}
          {recentChats.map((user) => (
            <div 
              key={user.id}
              className={`chat-sidebar-item flex items-center ${selectedUserId === user.id ? 'active' : ''}`}
              onClick={() => onSelectUser(user.id)}
            >
              {/* User avatar with online status indicator */}
              <div className="relative mr-3">
                <div className="user-avatar">
                  {/* Display first letter of username as avatar */}
                  {user.username.charAt(0).toUpperCase()}
                </div>
                {/* Status indicator changes color based on online status */}
                <div className={`user-status ${onlineUsers[user.username] ? 'online' : 'offline'}`}></div>
              </div>
              {/* User information */}
              <div>
                <div className="font-medium">{user.username}</div>
                <div className="text-xs opacity-70">
                  {onlineUsers[user.username] ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Shown when user has no recent chats
        <div className="p-4 text-center text-white/50">
          No recent chats found
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;
