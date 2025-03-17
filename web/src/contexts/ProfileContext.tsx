'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the Profile interface
interface Profile {
  id: number;
  username: string;
  age: number;
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/profile/${currentProfileId}`,
        { credentials: "include" }
      );

      const data = await response.json();
      
      if (data.user) {
        setProfileData(data.user);
        setIsOwner(data.isOwner);
        setStats(data.stats);
        setActivity(data.activity);
      } else {
        throw new Error("Invalid API response: Missing user object");
      }
    } catch (err) {
      setError("Error loading profile data");
      console.error(err);
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
