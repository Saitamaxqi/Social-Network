"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface UserProfile {
  id: string;
  username?: string | null;
  age?: number | null;
  gender?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  type?: string | null;
  requested?: boolean | null;
  avatar?: { String: string; Valid: boolean };
  profile_type?: string | null;
  about_me?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export default function ProfilePage() {
  const {id} = useParams(); // Dynamically extracts { id } from URL
  // const id = params.id as string; // Convert to string

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profile/${id}`);
        console.log('hereeee')
        if (!response.ok) throw new Error("Failed to load profile");

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError("Error loading profile");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProfile(); // Fetch only if id exists
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold">{profile?.username}'s Profile</h1>
      <p><strong>First Name:</strong> {profile?.first_name}</p>
      <p><strong>Last Name:</strong> {profile?.last_name}</p>
      <p><strong>Email:</strong> {profile?.email}</p>
      <p><strong>About Me:</strong> {profile?.about_me}</p>
    </div>
  );
}
