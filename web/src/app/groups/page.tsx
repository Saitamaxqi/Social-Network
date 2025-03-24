'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/Layout/MainLayout';

interface Group {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  created_at?: string; // Backend might return created_at instead of createdAt
  creatorId: number;
  memberCount: number;
  creator?: {
    id: number;
    username: string;
  };
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        
        // Fetch groups from the API
        const response = await fetch('/api/groups');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        // Ensure we always set an array, even if the API returns null
        const processedData = Array.isArray(data) ? data.map(group => {
          // Ensure we have the createdAt field (might be created_at in the API response)
          if (group.created_at && !group.createdAt) {
            group.createdAt = group.created_at;
          }
          return group;
        }) : [];
        
        setGroups(processedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching groups:', error);
        // If there's an error, set empty groups array
        setGroups([]);
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  return (
      <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Groups</h1>
          {user && (
            <Link 
              href="/groups/create" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Create Group
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      ) : groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Link href={`/groups/${group.id}`} key={group.id}>
              <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all hover:bg-gray-700 cursor-pointer h-full flex flex-col">
                <div className="p-5">
                  <h2 className="text-xl font-bold text-white mb-2 truncate">{group.title}</h2>
                  <p className="text-gray-300 mb-4 line-clamp-2 text-sm">{group.description}</p>
                </div>
                <div className="mt-auto p-4 bg-gray-900 border-t border-gray-700">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">
                      {'created at:'+group.createdAt ? new Date(group.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'Recently created'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-medium text-white mb-4">No Groups Yet</h2>
          <p className="text-gray-300 mb-8">Be the first to create a group!</p>
          {user && (
            <Link 
              href="/groups/create" 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors inline-block"
            >
              Create Group
            </Link>
          )}
        </div>
      )}
     </div>
     </MainLayout>
  );
}
