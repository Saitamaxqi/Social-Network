'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import Link from 'next/link';
import MainLayout from '@/components/Layout/MainLayout';
import Post from '@/components/Post/Post';

interface Group {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  creatorId: number;
  memberCount: number;
  members: {
    id: number;
    username: string;
    isCreator: boolean;
  }[];
}

interface Post {
  id: number;
  content: string;
  createdAt: string;
  authorId: number;
  authorName: string;
  commentCount: number;
}

interface Event {
  id: number;
  title: string;
  description: string;
  dateTime: string;
  creatorId: number;
  creatorName: string;
  going: number;
  notGoing: number;
}

type TabType = 'chat' | 'posts' | 'events';

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [events, setEvents] = useState<Event[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [isMember, setIsMember] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { user } = useAuth();
  const { setCurrentGroupId, setGroupMembers } = useGroup();

  useEffect(() => {
    // Set the current group ID in context when component mounts
    if (groupId && typeof groupId === 'string') {
      setCurrentGroupId(groupId);
    }
    
    return () => {
      // Clear the group ID when component unmounts
      setCurrentGroupId(null);
    };
  }, [groupId, setCurrentGroupId]);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch group details from the API
        const groupResponse = await fetch(`/api/groups/${groupId}`);
        
        if (!groupResponse.ok) {
          throw new Error(`Error fetching group: ${groupResponse.status}`);
        }
        
        const groupData = await groupResponse.json();
        setGroup(groupData);
        
        // Extract member IDs and update context
        if (groupData.members && Array.isArray(groupData.members)) {
          const memberIds = groupData.members
            .filter((member: any) => member.status === 'member')
            .map((member: any) => member.user_id);
          setGroupMembers(memberIds);
        }
        
        // Check if user is a member of the group
        const isMemberOfGroup = groupData.members?.some(
          (member: any) => member.user_id === user?.id && member.status === 'member'
        ) || false;
        
        setIsMember(isMemberOfGroup);
        
        // Check if user has a pending request
        const isPendingRequest = groupData.members?.some(
          (member: any) => member.user_id === user?.id && member.status === 'requested'
        ) || false;
        
        setIsPending(isPendingRequest);
        
        // Fetch posts if user is a member
        if (isMemberOfGroup) {
          const postsResponse = await fetch(`/api/groups/${groupId}/posts`);
          
          if (postsResponse.ok) {
            const postsData = await postsResponse.json();
            setPosts(postsData);
          } else {
            setPosts(null);
          }
          
          // Fetch events if user is a member
          const eventsResponse = await fetch(`/api/groups/${groupId}/events`);
          
          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            setEvents(eventsData);
          } else {
            setEvents(null);
          }
        }
        
        setLoading(false);
        
      } catch (error) {
        console.error('Error fetching group details:', error);
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId, user]);

  const handleJoinRequest = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Set pending status after successful request
      setIsPending(true);
      
      // Show success message
      alert('Your request to join has been sent!');
    } catch (error) {
      console.error('Error requesting to join group:', error);
      alert('Failed to send join request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Group Not Found</h1>
        <p className="text-gray-300 mb-8">The group you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link href="/groups" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
          Back to Groups
        </Link>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Group Header */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{group.title}</h1>
            <p className="text-gray-300 mb-4">{group.description}</p>
            <div className="flex space-x-4 text-sm text-gray-400">
              <span>{group.memberCount} members</span>
              <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          {user && !isMember && !isPending && (
            <button
              onClick={handleJoinRequest}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Request to Join
            </button>
          )}
          
          {user && isPending && (
            <div className="px-4 py-2 bg-yellow-600/30 text-yellow-200 rounded-md">
              Join Request Pending
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <div className="border-b border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'chat'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Group Chat
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'posts'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'events'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Events
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        {!isMember ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-medium text-white mb-4">Members Only</h2>
            <p className="text-gray-300 mb-8">You need to be a member of this group to view its content.</p>
            {user && !isPending && (
              <button
                onClick={handleJoinRequest}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Request to Join
              </button>
            )}
            {user && isPending && (
              <div className="px-6 py-3 bg-yellow-600/30 text-yellow-200 rounded-md inline-block">
                Your join request is pending approval
              </div>
            )}
            {!user && (
              <Link href="/auth/login" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                Login to Join
              </Link>
            )}
          </div>
        ) : (
          <>
            {activeTab === 'chat' && (
              <div className="min-h-[400px]">
                <div className="text-center py-12">
                  <h2 className="text-2xl font-medium text-white mb-4">Group Chat Coming Soon</h2>
                  <p className="text-gray-300">
                    This feature is currently under development. Check back soon!
                  </p>
                </div>
              </div>
            )}
            
            {activeTab === 'posts' && (
              <div className="min-h-[400px]">
                {/*use post */}
                <Post groupId={typeof groupId === 'string' ? groupId : undefined} />
              </div>
            )}
            
            {activeTab === 'events' && (
              <div className="min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-white">Upcoming Events</h2>
                  <Link 
                    href={`/groups/${groupId}/events/create`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
                  >
                    Create Event
                  </Link>
                </div>
                
                {events && events.length > 0 ? (
                  <div className="space-y-6">
                    {events.map((event) => (
                      <div key={event.id} className="bg-gray-700 rounded-lg p-4 shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-medium text-white">{event.title}</h3>
                          <div className="text-xs text-gray-400">
                            Created by {event.creatorName}
                          </div>
                        </div>
                        <p className="text-gray-200 mb-3">{event.description}</p>
                        <div className="bg-gray-800 px-3 py-2 rounded mb-4 text-blue-300 font-medium">
                          {new Date(event.dateTime).toLocaleString()}
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-300">
                            <span className="text-green-400">{event.going} going</span>
                            {' • '}
                            <span className="text-red-400">{event.notGoing} not going</span>
                          </div>
                          <Link 
                            href={`/groups/${groupId}/events/${event.id}`}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-medium text-white mb-4">No Events Yet</h2>
                    <p className="text-gray-300 mb-4">Plan something exciting for the group!</p>
                    <Link 
                      href={`/groups/${groupId}/events/create`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                    >
                      Create the first event
                    </Link>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </MainLayout>
  );
}
