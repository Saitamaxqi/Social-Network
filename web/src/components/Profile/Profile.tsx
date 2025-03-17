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
interface Post {
  id: number;
  title: string;
  body: string;
  media?: string | null; // Handle nullable SQL fields
  likes: number;
  dislikes: number;
  post_id?: number | null;
  user_id: number;
  created_at: string; // JSON usually sends dates as strings
  updated_at: string;
  original_post?: Post | null; // Recursive structure
  comments: Post[]; // Array of comments (nested posts)
  // categories: Category[]; // Array of categories
  user: Profile; // The user who made the post
  interaction: number;
}

interface Category {
  id: number;
  name: string;
}

interface ProfileStats {
  posts_count: number;
  followers_count: number;
  following_count: number;
}
interface Activity {
  posts: Post[]; 
  followers: any[];
  following: any[];
}


export function ProfilePage() {
  const { id } = useParams(); // Get dynamic route parameter
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // Initialize useRouter
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [activity, setActivity] = useState<Activity| null>(null);
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

<div>
  <p><strong>Posts:</strong> {stats?.posts_count ?? 0}</p>
</div>

<div>
  {activity?.posts && activity.posts.length > 0 ? (
    activity.posts.map((post) => (
      <div
        key={post.id}
        style={{
          border: "1px solid #ddd",
          padding: "10px",
          margin: "10px 0",
        }}
      >
        <h3>{post.title}</h3>
        <p>{post.body}</p>
        
        {/* Display media if available */}
        {post.media && (
          <img
            src={post.media}
            alt="Post media"
            style={{ maxWidth: "100%" }}
          />
        )}

        <p>👍 {post.likes} | 👎 {post.dislikes}</p>
        <p>Posted on: {new Date(post.created_at).toLocaleDateString()}</p>

        {/* Display original post if it's a repost */}
        {post.original_post && (
          <div style={{ padding: "10px", borderLeft: "3px solid #ccc", marginTop: "10px" }}>
            <h4>Reposted from: {post.original_post.user.username}</h4>
            <p>{post.original_post.body}</p>
          </div>
        )}

        {/* Display Comments */}
        {/* {(post.comments ?? []).length > 0 ? (
  post.comments.map((comment) => (
    <div key={comment.id}>
      <p>@{comment.user?.username || "Unknown"}: {comment.body}</p>
    </div>
  ))
) : (
  <p>No comments available.</p>
)} */}


        {/* Display Categories
        {(post.categories ?? []).length > 0 ? (
  post.categories.map((category) => (
    <div key={category.id}>
      <p>{category.name}</p>
    </div>
  ))
) : (
  <p>No categories available.</p>
)} */}

      </div>
    ))
  ) : (
    <p>No posts available.</p>
  )}
</div>



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