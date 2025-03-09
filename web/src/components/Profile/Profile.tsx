//this is the final work

import { useParams , useRouter} from "next/navigation";
import { useEffect, useState } from "react";

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

export function ProfilePage() {
  const { id } = useParams(); // Get dynamic route parameter
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/profile/${id}`,
          { credentials: "include" }
        );

        console.log("helllllo")
        const data = await response.json();

        // if (data.user.profile_type === "private" && !response.ok ) {
        //     setError("This account is private.");
        // }

        // if (!response.ok) throw new Error("Failed to fetch profile");
     
        if (data.user) {
          setProfile(data.user);
        } else {
          throw new Error("Invalid API response: Missing user object");
        }
      } catch (err) {
            setError("This account is private");
        console.error(err);
      }
    }

    if (id) fetchProfile();
  }, [id]);
  if (error) return <p>{error}</p>; // Show error message if the account is private
  if (!profile) return <p>Loading...</p>;

  return (
    <div>
     {/* <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full text-center"> */}
        <div >
        {/* Avatar */}
        {profile.avatar.Valid && (
        <img
          src= {profile.avatar.String}
          alt="User Avatar"
          className="w-24 h-24 mx-auto rounded-full mb-4"
        />
      )}
        </div>
      <h1>Profile Page</h1>
      <p>ID: {profile.id}</p>
      <h1>
        {profile.first_name} {profile.last_name}
      </h1>
      <p >@{profile.username}</p>
      <div>
          <p><strong>Age:</strong> {profile.age}</p>
          <p><strong>Gender:</strong> {profile.gender}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Profile Type:</strong> {profile.profile_type}</p>

          {profile.about_me && (
            <p className="mt-2"><strong>About Me:</strong> {profile.about_me}</p>
          )}
        </div>


        <button 
                 className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  onClick={() =>             router.push("/profile") }
        >
          
          Edit Profile
        </button> 
    </div>
    
  );
}
