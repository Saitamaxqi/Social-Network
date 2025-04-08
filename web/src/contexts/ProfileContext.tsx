'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the Profile interface
interface Profile {
  id: number;
  username: string;
  date_of_birth: string;
  gender: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_type: string;
  about_me?: string;
  avatar: { String: string; Valid: boolean };
}

interface ProfileStats {
  posts_count: number;
  followers_count: number;
  following_count: number;
}

interface ProfileActivity {
  followers: any[];
  following: any[];
  posts: any[];
}

interface ProfileContextType {
  currentProfileId: string | null;
  setCurrentProfileId: (profileId: string | null) => void;
  profileData: Profile | null;
  setProfileData: (profile: Profile | null) => void;
  isOwner: boolean;
  setIsOwner: (isOwner: boolean) => void;
  isCloseFriend: boolean;
  setIsCloseFriend: (isCloseFriend: boolean) => void;
  stats: ProfileStats | null;
  setStats: (stats: ProfileStats | null) => void;
  activity: ProfileActivity | null;
  setActivity: (activity: ProfileActivity | null) => void;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isCloseFriend, setIsCloseFriend] = useState<boolean>(false);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [activity, setActivity] = useState<ProfileActivity | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch profile data
  const refreshProfile = async () => {
    if (!currentProfileId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Construct the API URL based on environment
      let baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
      
      // Special handling for Docker environment
      // In browser, 'backend' hostname won't resolve, so we need to use localhost
      if (typeof window !== 'undefined' && baseApiUrl.includes('http://backend:')) {
        baseApiUrl = baseApiUrl.replace('http://backend:', 'http://localhost:');
      }
      
      const apiUrl = `${baseApiUrl}/profile/${currentProfileId}`;
      
      console.log('Fetching profile from:', apiUrl);
      
      const response = await fetch(
        apiUrl,
        { credentials: "include" }
      );

      // Check if the response is OK before trying to parse JSON
      if (!response.ok) {
        // Try to get the text of the error message
        const errorText = await response.text();
        
        // Handle specific error cases
        if (errorText.includes("Profile is private")) {
          setError("This profile is private");
        } else {
          setError(errorText || `Error: ${response.status}`);
        }
        
        // Clear profile data since we couldn't load it
        setProfileData(null);
        setStats(null);
        setActivity(null);
        return;
      }
      
      // Now safely parse JSON since we know the response is OK
      const data = await response.json();
      
      if (data.user) {
        setProfileData(data.user);
        setIsOwner(data.isOwner);
        setIsCloseFriend(data.isCloseFriend);
        setStats(data.stats);
        setActivity(data.activity);
      } else {
        throw new Error("Invalid API response: Missing user object");
      }
    } catch (err) {
      // Only set a generic error if we haven't already set a specific one
      if (!error) {
        setError("Error loading profile data");
      }
      console.error("Profile loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile data when ID changes
  useEffect(() => {
    if (currentProfileId) {
      refreshProfile();
    } else {
      // Reset state when no profile ID is set
      setProfileData(null);
      setIsOwner(false);
      setIsCloseFriend(false);
      setStats(null);
      setActivity(null);
      setError(null);
    }
  }, [currentProfileId]);

  return (
    <ProfileContext.Provider
      value={{
        currentProfileId,
        setCurrentProfileId,
        profileData,
        setProfileData,
        isOwner,
        setIsOwner,
        isCloseFriend,
        setIsCloseFriend,
        stats,
        setStats,
        activity,
        setActivity,
        loading,
        error,
        refreshProfile
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
