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

interface ProfileStats {
  posts_count: number;
  followers_count: number;
  following_count: number;
}

export function ProfilePage() {
  const { id } = useParams(); // Get dynamic route parameter
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // Initialize useRouter
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [activity, setActivity] = useState<{ followers: any[]; following: any[] } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
const [popupType, setPopupType] = useState<"followers" | "following" | null>(null);

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
          setIsOwner(data.isOwner);
        setStats(data.stats);  
        setActivity(data.activity); 
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
        {/* <div >
        {profile.avatar.Valid && (
        <img
          src= {profile.avatar.String}
          alt="User Avatar"
          className="w-24 h-24 mx-auto rounded-full mb-4"
        />
      )}
        </div> */}
         <div>
                      {profile.avatar?.Valid  && (
                        <img
                          src={`http://localhost:8080${profile.avatar.String}`}
                          alt={profile.username}
                          width={200}
                          height={200}
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
        {isOwner && ( 
  <button 
    onClick={() => router.push("/profile")}
  >
    Edit Profile
  </button>
)}

         {/* {isOwner ? <p>This is your profile</p> : <p>This is someone else's profile</p>} */}
        
         {/* <div>
  <p>Posts: {stats?.posts_count ?? 0}</p>
  <p>Followers: {stats?.followers_count ?? 0}</p>
  <p>Following: {stats?.following_count ?? 0}</p>
</div> */}
<div>
  <p onClick={() => { setPopupType("followers"); setShowPopup(true); }}>
    Followers: {stats?.followers_count ?? 0}
  </p>
  
  <p onClick={() => { setPopupType("following"); setShowPopup(true); }}>
    Following: {stats?.following_count ?? 0}
  </p>
</div>
{showPopup && popupType && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className=" p-4 rounded shadow-lg">
      <h2>{popupType === "followers" ? "Followers" : "Following"}</h2>

      {/* Check if activity[popupType] is an array before accessing .length */}
      {Array.isArray(activity?.[popupType]) && activity[popupType].length > 0 ? (
        <ul>
          {activity[popupType].map((user) => (
            <li key={user.id}>@{user.username}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">
          {popupType === "followers" ? "No followers yet." : "Not following anyone yet."}
        </p>
      )}

      <button onClick={() => setShowPopup(false)}>Close</button>
    </div>
  </div>
)}


    </div>
    
  );
}

// function isOwner(response) {

//   if (response.isOwner) {
//     return (
//       <button 
//                   onClick={() =>             router.push("/profile") }
//         >
          
//           Edit Profile
//         </button> 

//     )
//   }
// }