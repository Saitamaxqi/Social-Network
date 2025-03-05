'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';

interface ChatUser {
  id: number;
  username: string;
  avatar: {
    String: string;
    Valid: boolean;
  };
}

interface ChatsResponse {
  onlineUsers: Record<string, boolean>;
  recentChats: ChatUser[];
}

export default function UsersSidebar() {
  const [chatData, setChatData] = useState<ChatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

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

  // Return null if user is not authenticated
  if (!user) {
    return null;
  }

  // Function to navigate to chat with a specific user
  const navigateToChat = (userId: number) => {
    router.push(`/chats?userId=${userId}`);
  };

  return (
    <div className="w-64 min-h-screen h-full bg-black/10 backdrop-blur-sm fixed right-0 top-0 flex flex-col">
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="text-white text-center py-4">Loading users...</div>
          ) : error ? (
            <div className="text-red-400 text-center py-4">{error}</div>
          ) : !chatData?.recentChats?.length ? (
            <div className="text-white text-center py-4">No users found</div>
          ) : (
            chatData.recentChats.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between w-full px-4 py-2 text-white bg-black/30 hover:bg-black/50 rounded-lg transition-colors duration-200"
              >
                <Link
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-2 flex-1"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                      {user.avatar.Valid ? (
                        <Image
                          src={user.avatar.String}
                          alt={user.username}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm">{user.username[0].toUpperCase()}</span>
                      )}
                    </div>
                    {/* Online/Offline status indicator */}
                    <div 
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900 ${chatData.onlineUsers[user.id.toString()] ? 'bg-green-500' : 'bg-gray-500'}`} 
                      title={chatData.onlineUsers[user.id.toString()] ? 'Online' : 'Offline'}
                    />
                  </div>
                  <span className="text-sm font-medium">{user.username}</span>
                </Link>
                {/* Chat icon button */}
                <button 
                  onClick={() => navigateToChat(user.id)}
                  className="ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                  title="Chat with user"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
