'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import styles from './UsersSidebar.module.css';

import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { useWebSocket } from '@/contexts/WebSocketContext';

interface ChatUser {
  id: number;
  username: string;
  avatar: {
    String: string;
    Valid: boolean;
  };
}

interface FollowStatus {
  id: number;
  status: string; // 'accepted' | 'pending' | 'none'
  follower_id?: number;
  following_id?: number;
  created_at?: string;
  updated_at?: string;
}

interface ChatsResponse {
  onlineUsers: Record<string, boolean>;
  recentChats: ChatUser[];
  followStatuses: Record<string, FollowStatus>;
}

// Helper function to get follow button text based on status
const getFollowButtonText = (status: FollowStatus): string => {
  switch (status.status) {
    case 'accepted':
      return 'Following';
    case 'pending':
      return 'Pending';
    case 'none':
      return 'Follow';
    default:
      return 'Follow';
  }
};

// Helper function to get follow button styles based on status
const getFollowButtonStyles = (status: FollowStatus): string => {
  switch (status.status) {
    case 'accepted':
      return styles.followButtonAccepted;
    case 'pending':
      return styles.followButtonPending;
    case 'none':
      return styles.followButtonNone;
    default:
      return styles.followButtonNone;
  }
};

export default function UsersSidebar() {
  const [chatData, setChatData] = useState<ChatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { currentGroupId, showGroupMembersOnly, setShowGroupMembersOnly, groupMembers } = useGroup();
  const { socket } = useWebSocket();
  
  // Check if we're on a group page
  const isGroupPage = pathname?.startsWith(`/groups/${currentGroupId}`) || false;

  useEffect(() => {
    if (!user) return;
    
    const fetchChats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setChatData(data);
        } else {
          throw new Error('Failed to fetch chats');
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
        setError('Failed to load chats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
  }, [user]);

  // WebSocket event listener for real-time user status updates
  useEffect(() => {
    if (!socket) return;

    // Function to fetch chats data
    const fetchChats = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setChatData(data);
        } else {
          throw new Error('Failed to fetch chats');
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };

    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // Check if the message is a user status update
        if (data.type === "user status") {
          // Refetch all chats data to get the latest status
          fetchChats();
          console.log(`Received user status update, refetching chats data`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    // Add event listener
    socket.addEventListener('message', handleWebSocketMessage);

    // Clean up event listener
    return () => {
      socket.removeEventListener('message', handleWebSocketMessage);
    };
  }, [socket]);

  // Return null if user is not authenticated
  if (!user) {
    return null;
  }

  // Function to navigate to chat with a specific user
  const navigateToChat = (userId: number) => {
    router.push(`/chats?userId=${userId}`);
  };

  // Filter users based on group membership if filter is active
  const filteredUsers = showGroupMembersOnly && isGroupPage && chatData?.recentChats
    ? chatData.recentChats.filter(user => groupMembers.includes(user.id))
    : chatData?.recentChats || [];

  return (
    <div className={styles.sidebar}>
      {/* Header for mobile view */}
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarTitle}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Friends & Users
        </div>
        <div className={styles.onlineCount}>
          {chatData && Object.values(chatData.onlineUsers).filter(Boolean).length} online
        </div>
      </div>

      <div className={styles.sidebarContent}>
        {isGroupPage && (
          <div className={styles.filterContainer}>
            <button 
              className={`${styles.filterButton} ${showGroupMembersOnly ? styles.filterActive : ''}`}
              onClick={() => setShowGroupMembersOnly(!showGroupMembersOnly)}
            >
              {showGroupMembersOnly ? '✓ Show Group Members' : '☐ Show Group Members'}
            </button>
          </div>
        )}
        <div className={styles.userList}>
          {isLoading ? (
            <div className={styles.loadingText}>Loading users...</div>
          ) : error ? (
            <div className={styles.errorText}>{error}</div>
          ) : !filteredUsers.length ? (
            <div className={styles.emptyText}>{showGroupMembersOnly ? 'No group members found' : 'No users found'}</div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className={styles.userCard}>
                <Link href={`/profile/${user.id}`} className={styles.userLink}>
                  <div className={styles.avatarContainer}>
                    <div className={styles.avatar}>
                      {user.avatar?.Valid ? (
                        <Image
                          src={`http://localhost:8080${user.avatar.String}`}
                          alt={user.username}
                          width={32}
                          height={32}
                          className={styles.avatarImage}
                        />
                      ) : (
                        <span className={styles.avatarLetter}>{user.username[0].toUpperCase()}</span>
                      )}
                    </div>
                    {/* Online/Offline status indicator */}
                    <div 
                      className={`${styles.onlineStatus} ${chatData?.onlineUsers?.[user.username] ? styles.online : styles.offline}`}
                      title={chatData?.onlineUsers?.[user.username] ? 'Online' : 'Offline'}
                    />
                  </div>
                  <span className={styles.username} title={user.username}>
                    {user.username}
                  </span>
                </Link>
                {/* Chat icon button */}
                <div className={styles.buttonContainer}>
                  {/* Follow Button */}
                  {chatData?.followStatuses?.[user.username] !== undefined && (
                    <button
                      onClick={async (e) => {
                        e.preventDefault(); // Prevent navigation
                        try {
                          const currentStatus = chatData?.followStatuses?.[user.username];
                          const isFollowing = currentStatus.status !== 'none';
                          
                          const formData = new FormData();
                          formData.append('user_id', user.id.toString());
                          
                          const endpoint = !isFollowing ? 
                            '/api/follow' : 
                            `/api/follow/${currentStatus.id}`;
                            
                          const response = await fetch(endpoint, {
                            method: !isFollowing ? 'POST' : 'DELETE',
                            credentials: 'include',
                            body: !isFollowing ? formData : undefined,
                          });
                          
                          if (!response.ok) throw new Error('Failed to update follow status');
                          
                          const data = await response.json();
                          
                          // Update local state
                          setChatData(prev => prev ? {
                            ...prev,
                            followStatuses: {
                              ...prev.followStatuses,
                              [user.username]: !isFollowing ? 
                                { id: data.id, status: data.status } : 
                                { id: 0, status: 'none' as const }
                            }
                          } : null);
                        } catch (error) {
                          console.error('Error updating follow status:', error);
                        }
                      }}
                      className={`${styles.followButton} ${getFollowButtonStyles(chatData?.followStatuses?.[user.username])}`}
                    >
                      {getFollowButtonText(chatData?.followStatuses?.[user.username])}
                    </button>
                  )}
                  {/* Chat Button */}
                  <button 
                    onClick={() => navigateToChat(user.id)}
                    className={styles.chatButton}
                    title="Chat with user"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={styles.chatIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
