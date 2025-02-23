'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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

  return (
    <div className="w-64 min-h-screen h-full bg-black/10 backdrop-blur-sm fixed right-0 top-0 flex flex-col">
      <div className="flex-1 p-4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-white text-center">Recent Chats</h2>
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="text-white text-center py-4">Loading chats...</div>
          ) : error ? (
            <div className="text-red-400 text-center py-4">{error}</div>
          ) : !chatData?.recentChats?.length ? (
            <div className="text-white text-center py-4">No recent chats</div>
          ) : (
            chatData.recentChats.map((user) => (
              <Link
                key={user.id}
                href={`/profile/${user.id}`}
                className="flex items-center w-full px-4 py-2 text-white bg-black/30 hover:bg-black/50 rounded-lg transition-colors duration-200"
              >
                <div className="flex items-center gap-2">
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
                  {chatData.onlineUsers[user.id.toString()] && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-900" />
                  )}
                </div>
                <span className="text-sm font-medium">{user.username}</span>
              </div>
            </Link>
          ))
          )}
        </div>
      </div>
    </div>
  );
}
