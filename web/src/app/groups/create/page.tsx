'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function CreateGroupPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a group');
      return;
    }
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      console.log('Submitting group with:', { title, description });
      
      // Call the API to create a new group with JSON data
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description: description || '',
        }),
        credentials: 'include',
      });
      
      console.log('Response status:', response.status);
      
      // Try to get the response text for better error handling
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let data;
      try {
        // Try to parse the response as JSON
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error(`Server returned invalid JSON. Status: ${response.status}`);
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.status}`);
      }
      
      // Redirect to the newly created group page or groups list
      if (data.id) {
        router.push(`/groups/${data.id}`);
      } else {
        router.push('/groups');
      }
      router.refresh();
      
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Failed to create group. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-white mb-8">Create New Group</h1>
      
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6 shadow-lg">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-md text-red-100">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <label htmlFor="title" className="block text-gray-200 mb-2 font-medium">
            Group Title*
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter group title"
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="description" className="block text-gray-200 mb-2 font-medium">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
            placeholder="Describe what your group is about"
          />
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </form>
    </div>
  );
}
