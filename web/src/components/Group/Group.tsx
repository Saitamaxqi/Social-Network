'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import Link from 'next/link';
import Post from '../Post/Post';


// interface Group {
//   id: number;
//   title: string;
//   description: string;
//   createdAt: string;
//   created_at?: string; // Backend might return created_at instead of createdAt
//   creatorId: number;
//   memberCount: number;
//   members: {
//     id: number;
//     username: string;
//     isCreator: boolean;
//     user_id?: number;
//     status?: string;
//   }[];
//   creator?: {
//     id: number;
//     username: string;
//   };
// }

type TabType = 'chat' | 'posts' | 'events';

// Helper function to safely format dates
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'Unknown date';
  
  try {
    // Handle ISO date format: '2025-03-13T06:04:06Z'
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Unknown date';
    }
    
    // Return formatted date
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown date';
  }
};

export default function Group() {
  const { groupId } = useParams();
  const [group, setGroup] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [isMember, setIsMember] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isInvited, setIsInvited] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
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
        console.log('Raw group data:', groupData);
        
        // Ensure we have the createdAt field (might be created_at in the API response)
        if (groupData.created_at && !groupData.createdAt) {
          console.log('Using created_at instead of createdAt:', groupData.created_at);
          groupData.createdAt = groupData.created_at;
        }
        
        setGroup(groupData);
        console.log('Group data:', group);
        
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
        
        // Check if user has been invited to the group
        const isInvitedToGroup = groupData.members?.some(
          (member: any) => member.user_id === user?.id && member.status === 'pending'
        ) || false;
        
        setIsInvited(isInvitedToGroup);
        
      } catch (error) {
        console.error('Error fetching group details:', error);
        setLoading(false);
      }
      setLoading(false);
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
    {/* Group Header */}
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 mb-8 shadow-xl border border-gray-700">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        {/* Group Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-600 h-10 w-1 rounded-full"></div>
            <h1 className="text-3xl font-bold text-white">{group.title}</h1>
          </div>
          
          <div className="bg-gray-800/50 p-4 rounded-lg mb-4 border-l-4 border-blue-500">
            <p className="text-gray-300 leading-relaxed">{group.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-800/30 p-3 rounded-lg flex flex-col items-center">
              <span className="text-gray-400 mb-1">Creator</span>
              <span className="text-white font-medium">{group.creator?.username || 'Unknown'}</span>
            </div>
            
            <div className="bg-gray-800/30 p-3 rounded-lg flex flex-col items-center">
              <span className="text-gray-400 mb-1">Created</span>
              <span className="text-white font-medium">
                {formatDate(group.createdAt || group.created_at)}
              </span>
            </div>
            {/* Members only who is status is member     */}
            <div className="bg-gray-800/30 p-3 rounded-lg flex flex-col items-center">
              <span className="text-gray-400 mb-1">Members</span>
              <span className="text-white font-medium">{group.memberCount || (group.members?.filter((member: any) => member.status === 'member').length || 0)}</span>
            </div>
          </div>
        </div>
        
        {/* Action Button */}
        <div className="flex flex-col justify-center items-center">   
          {user && isMember && parseInt(user.id) !== group.creator?.id && (
            <div className="px-6 py-3 bg-green-600/30 text-green-200 rounded-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Member
            </div>
          )}
          
          {user && isMember && parseInt(user.id) === group.creator?.id && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              Invite Members
            </button>
          )}
        </div>
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
          {user && !isPending && !isInvited && (
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
          {user && isInvited && (
            <div className="px-6 py-3 bg-indigo-600 text-white rounded-md inline-block shadow-md">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                <span>Check your notifications to accept the invitation</span>
              </div>
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
          
          {/* {activeTab === 'events' && (
             <Events groupId={typeof groupId === 'string' ? groupId : undefined} />
          )} */}
        </>
      )}
    </div>

    {/* Invite Members Modal */}
    {showInviteModal && (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Invite Members</h3>
            <button 
              onClick={() => setShowInviteModal(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-4">
            <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-300 mb-2">
              Enter username
            </label>
            <input
              type="text"
              id="inviteEmail"
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="username"
              value={inviteUsername}
              onChange={(e) => {
                setInviteUsername(e.target.value);
                setInviteError(null); // Clear any previous errors when typing
              }}
            />
          </div>
          
          {inviteError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-md text-red-200 text-sm">
              {inviteError}
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowInviteModal(false);
                setInviteUsername('');
                setInviteError(null);
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
              disabled={inviteLoading}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                // Validate input
                if (!inviteUsername.trim()) {
                  setInviteError('Please enter a username');
                  return;
                }
                
                try {
                    console.log('Group:', group);
                  setInviteLoading(true);
                  setInviteError(null);
                  
                  // Check if user is already a member
                  //make the check more specific based on there status  
                  const isMemberAlready = group?.members?.some((member: any) => 
                    member?.user?.username && member.user.username.toLowerCase() === inviteUsername.trim().toLowerCase() && member.status === 'member');
                  
                  if (isMemberAlready) {
                    setInviteError('User is already a member of this group');
                    return;
                  }
                  
                  // Check if there's a pending invitation
                  const isPending = group?.members?.some((member: any) => 
                    member?.user?.username && member.user.username.toLowerCase() === inviteUsername.trim().toLowerCase() && member.status === 'pending');
                  
                  if (isPending) {
                    setInviteError('There is already a pending invitation for this user');
                    return;
                  }

                  // Check if user has requested to join
                  const isRequested = group?.members?.some((member: any) => 
                    member?.user?.username && member.user.username.toLowerCase() === inviteUsername.trim().toLowerCase() && member.status === 'requested');
                  
                  if (isRequested) {
                    setInviteError('This user has already requested to join the group');
                    return;
                  }
                  
                  // All checks passed, send the invitation
                  const inviteResponse = await fetch(`/api/groups/${groupId}/invite`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      username: inviteUsername.trim(),
                  }),
                  });
                  
                  if (!inviteResponse.ok) {
                    const errorData = await inviteResponse.json();
                    throw new Error(errorData.message || 'Failed to send invitation');
                  }
                  
                  // Success
                  alert('Invitation sent successfully!');
                  setInviteUsername('');
                  setShowInviteModal(false);
                } catch (error) {
                  console.error('Error sending invitation:', error);
                  setInviteError(error instanceof Error ? error.message : 'Failed to send invitation');
                } finally {
                  setInviteLoading(false);
                }
              }}
              className={`px-4 py-2 ${inviteLoading ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md transition-colors flex items-center gap-2`}
              disabled={inviteLoading}
            >
              {inviteLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : 'Send Invite'}
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
    );
}
