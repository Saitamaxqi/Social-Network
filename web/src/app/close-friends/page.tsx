'use client';

import { useState, useEffect } from 'react';
import { UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface User {
  id: number;
  username: string;
  avatar?: string;
  first_name: string;
  last_name: string;
}

interface CloseFriend {
  id: number;
  user_id: number;
  friend_id: number;
  friend: User;
  created_at: string;
}

export default function CloseFriendsPage() {
  const [closeFriends, setCloseFriends] = useState<CloseFriend[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchCloseFriends();
    fetchFollowers();
  }, []);

  const fetchCloseFriends = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/close-friends');
      setCloseFriends(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch close friends');
      console.error('Error fetching close friends:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    try {
      const response = await axios.get('/api/followers');
      setFollowers(response.data);
    } catch (err: any) {
      console.error('Error fetching followers:', err);
    }
  };

  const addCloseFriend = async (friendId: number) => {
    try {
      await axios.post('/api/close-friends', { friend_id: friendId });
      fetchCloseFriends();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add close friend');
      console.error('Error adding close friend:', err);
    }
  };

  const removeCloseFriend = async (friendId: number) => {
    try {
      await axios.delete(`/api/close-friends/${friendId}`);
      fetchCloseFriends();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove close friend');
      console.error('Error removing close friend:', err);
    }
  };

  // Filter followers that are not already close friends
  const filteredFollowers = followers.filter(
    follower => !closeFriends.some(cf => cf.friend_id === follower.id)
  );

  // Filter by search term
  const searchedFollowers = filteredFollowers.filter(
    follower => 
      follower.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${follower.first_name} ${follower.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Close Friends</h1>
        
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Close Friends */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Your Close Friends</h2>
            <p className="text-gray-400 mb-4">
              Posts shared with close friends are only visible to people on this list.
            </p>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : closeFriends.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <UserIcon className="h-12 w-12 mx-auto mb-2 text-gray-500" />
                <p>You haven&apos;t added any close friends yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-700">
                {closeFriends.map((cf) => (
                  <li key={cf.id} className="py-3 flex items-center justify-between">
                    <Link href={`/profile/${cf.friend_id}`} className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-600 overflow-hidden mr-3">
                        {cf.friend.avatar ? (
                          <Image 
                            src={cf.friend.avatar} 
                            alt={cf.friend.username} 
                            width={40} 
                            height={40} 
                            className="object-cover h-full w-full"
                          />
                        ) : (
                          <UserIcon className="h-6 w-6 m-2 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{cf.friend.username}</p>
                        <p className="text-sm text-gray-400">{cf.friend.first_name} {cf.friend.last_name}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => removeCloseFriend(cf.friend_id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Remove from close friends"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add Close Friends */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Add Close Friends</h2>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search followers..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {filteredFollowers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>All your followers are already in your close friends list or you don&apos;t have any followers yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
                {searchedFollowers.map((follower) => (
                  <li key={follower.id} className="py-3 flex items-center justify-between">
                    <Link href={`/profile/${follower.id}`} className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-600 overflow-hidden mr-3">
                        {follower.avatar ? (
                          <Image 
                            src={follower.avatar} 
                            alt={follower.username} 
                            width={40} 
                            height={40} 
                            className="object-cover h-full w-full"
                          />
                        ) : (
                          <UserIcon className="h-6 w-6 m-2 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{follower.username}</p>
                        <p className="text-sm text-gray-400">{follower.first_name} {follower.last_name}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => addCloseFriend(follower.id)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-full transition-colors"
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
