'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/components/Chat/ChatInterface';

/**
 * ChatsPage Component
 * 
 * The main chat page of the application that renders the ChatInterface component.
 * This page is responsible for checking authentication and rendering the chat interface
 * only if the user is properly authenticated.
 * 
 * Features:
 * - Authentication check on load
 * - Redirects to login page if user is not authenticated
 * - Renders a loading state while authentication status is being checked
 * - Renders the full ChatInterface once user is authenticated
 */
export default function ChatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        // Use the correct API endpoint path to match our API route
        const response = await fetch('/api/check-session', {
          credentials: 'include' // Include cookies in the request
        });
        if (!response.ok) {
          router.push('/auth/login');
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        router.push('/auth/login');
      }
    };
    
    checkAuth();
  }, [router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-white">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="h-full bg-gray-900 rounded-lg overflow-hidden shadow-lg relative">
        <ChatInterface />
      </div>
    </MainLayout>
  );
}
