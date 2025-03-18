//this is the final work

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import Image from "next/image";
import styles from "./Profile.module.css";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';

export function ProfilePage() {
  const { id } = useParams(); // Get dynamic route parameter
  const router = useRouter(); // Initialize useRouter
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState<"followers" | "following" | null>(null);
  
  const { 
    setCurrentProfileId, 
    profileData: profile, 
    isOwner, 
    isCloseFriend, 
    setIsCloseFriend,
    stats, 
    activity, 
    loading, 
    error 
  } = useProfile();

  // Set the current profile ID when the component mounts or ID changes
  useEffect(() => {
    if (id) {
      setCurrentProfileId(id.toString());
    }
    
    // Clean up when component unmounts
    return () => {
      setCurrentProfileId(null);
    };
  }, [id, setCurrentProfileId]);

  // Handle adding/removing close friend
  const handleCloseFriendToggle = async () => {
    if (!profile) return;
    
    try {
      // Call the same endpoint for both adding and removing
      const response = await fetch('/api/close-friends', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ friend_id: profile.id })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update state based on the response
        setIsCloseFriend(data.isCloseFriend);
      } else {
        console.error('Failed to toggle close friend status');
      }
    } catch (error) {
      console.error('Error toggling close friend status:', error);
    }
  };
  
  if (error) return <p>{error}</p>; // Show error message if the account is private
  if (loading || !profile) return <p>Loading...</p>;

  return (
    <div className={styles.profileContainer}>
      {/* Profile Header */}
      <div className={styles.profileHeader}>
        {/* Avatar */}
        <div className={styles.avatarContainer}>
          <div className={styles.avatar}>
            {profile.avatar?.Valid ? (
              profile.avatar.String.startsWith('http') ? (
                <Image
                  src={profile.avatar.String}
                  alt={profile.username}
                  width={150}
                  height={150}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              ) : (
                <img
                  src={`http://localhost:8080${profile.avatar.String}`}
                  alt={profile.username}
                  width={150}
                  height={150}
                  style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: '50%' }}
                />
              )
            ) : (
              <span>{profile.username[0].toUpperCase()}</span>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className={styles.profileInfo}>
          {/* Username and Edit Button */}
          <div className={styles.usernameRow}>
            <h2 className={styles.username}>{profile.username}</h2>
            {isOwner ? (
              <button 
                className={styles.editButton}
                onClick={() => router.push("/profile")}
              >
                Edit Profile
              </button>
            ) : (
              <button 
                className={`${styles.closeFriendButton} ${isCloseFriend ? styles.closeFriendActive : ''}`}
                onClick={handleCloseFriendToggle}
                title={isCloseFriend ? "Remove from close friends" : "Add to close friends"}
              >
                <svg className={styles.starIcon} fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                {isCloseFriend ? 'Close Friend' : 'Add to Close Friends'}
              </button>
            )}
          </div>

          {/* Stats Row */}
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats?.posts_count ?? 0}</span> posts
            </div>
            <div 
              className={styles.stat} 
              onClick={() => { setPopupType("followers"); setShowPopup(true); }}
            >
              <span className={styles.statValue}>{stats?.followers_count ?? 0}</span> followers
            </div>
            <div 
              className={styles.stat}
              onClick={() => { setPopupType("following"); setShowPopup(true); }}
            >
              <span className={styles.statValue}>{stats?.following_count ?? 0}</span> following
            </div>
          </div>

          {/* Bio Section */}
          <div className={styles.bioSection}>
            <div className={styles.fullName}>
              {profile.first_name} {profile.last_name}
            </div>
            {profile.about_me && (
              <div className={styles.bio}>{profile.about_me}</div>
            )}
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className={styles.postsSection}>
        <div className={styles.postsHeader}>
          <div className={`${styles.postsHeaderItem} ${styles.postsHeaderItemActive}`}>
            <svg aria-label="Posts" color="currentColor" fill="currentColor" height="12" role="img" viewBox="0 0 24 24" width="12">
              <rect fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" width="18" x="3" y="3"></rect>
              <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="9.015" x2="9.015" y1="3" y2="21"></line>
              <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="14.985" x2="14.985" y1="3" y2="21"></line>
              <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="21" x2="3" y1="9.015" y2="9.015"></line>
              <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="21" x2="3" y1="14.985" y2="14.985"></line>
            </svg>
            <span style={{ marginLeft: '6px' }}>POSTS</span>
          </div>
        </div>

        {/* Posts Grid */}
        <div className={styles.postsGrid}>
          {activity?.posts && activity.posts.length > 0 ? (
            activity.posts.map((post: any) => (
              <div 
                key={post.id} 
                className={styles.postCard} 
                onClick={() => router.push(`/posts?scrollTo=${post.id}`)}
              >
                {/* Simple Post Content */}
                <div className={styles.postContent}>
                  {post.title && <h3 className={styles.postTitle}>{post.title}</h3>}
                  
                  {/* Creation Time */}
                  {post.created_at && (
                    <div className={styles.postTime}>
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </div>
                  )}
                  
                  {/* Content Preview */}
                  {post.content && (
                    <p className={styles.postBody}>
                      {post.content.length > 100 
                        ? `${post.content.substring(0, 100)}...` 
                        : post.content
                      }
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noPostsMessage}>
              No posts yet
            </div>
          )}
        </div>
      </div>

      {/* Followers/Following Modal */}
      {showPopup && popupType && (
        <div className={styles.modalOverlay} onClick={() => setShowPopup(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {popupType === "followers" ? "Followers" : "Following"}
              </h3>
              <button className={styles.closeButton} onClick={() => setShowPopup(false)}>
                ×
              </button>
            </div>

            <div className={styles.userList}>
              {popupType && activity && Array.isArray(activity[popupType]) && activity[popupType].length > 0 ? (
                activity[popupType].map((user: {id: number, username: string, avatar?: {String: string, Valid: boolean}}) => (
                  <Link href={`/profile/${user.id}`} key={user.id} className={styles.userItem}>
                    {user.avatar?.Valid ? (
                      user.avatar.String.startsWith('http') ? (
                        <Image 
                          src={user.avatar.String}
                          alt={user.username}
                          width={32}
                          height={32}
                          className={styles.userAvatar}
                        />
                      ) : (
                        <img 
                          src={`http://localhost:8080${user.avatar.String}`}
                          alt={user.username}
                          width={32}
                          height={32}
                          className={styles.userAvatar}
                        />
                      )
                    ) : (
                      <div className={styles.userAvatarPlaceholder}>
                        {user.username[0].toUpperCase()}
                      </div>
                    )}
                    <span className={styles.userName}>{user.username}</span>
                  </Link>
                ))
              ) : (
                <p>
                  {popupType === "followers" ? "No followers yet." : "Not following anyone yet."}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}