import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { GlobeAltIcon, LockClosedIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface Category {
  id: string;
  name: string;
}

interface Author {
  id: string;
  username?: string;
  email?: string;
  avatar?: string;
}

interface Post {
  id: string;
  title?: string;
  content?: string;
  body?: string;
  media?: string;
  created_at: string;
  author?: Author;
  user?: Author;
  categories?: Category[];
  category?: Category;
  likes?: number;
  dislikes?: number;
  interaction?: string;
  comments?: Post[];
  post_id?: string;
  visibility?: string;
  group_id?: string;
}

interface GroupPostProps {
  groupId: string;
  categoryId?: string;
}

export default function GroupPost({ groupId, categoryId }: GroupPostProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filterCategories, setFilterCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentMediaFiles, setCommentMediaFiles] = useState<Record<string, File | null>>({});
  const [commentMediaPreviews, setCommentMediaPreviews] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const router = useRouter();

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setFilterCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  // Fetch group posts
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const url = categoryId 
        ? `/api/groups/${groupId}/posts?category=${categoryId}` 
        : `/api/groups/${groupId}/posts`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch group posts');
      }
      
      const data = await response.json();
      
      // For each post, fetch its comments count
      const postsWithCommentCounts = await Promise.all(
        data.map(async (post: Post) => {
          try {
            const postDetailsResponse = await fetch(`/api/posts/${post.id}`);
            if (postDetailsResponse.ok) {
              const postDetails = await postDetailsResponse.json();
              return {
                ...post,
                comments: postDetails.comments || []
              };
            }
          } catch (error) {
            console.error(`Error fetching comments for post ${post.id}:`, error);
          }
          return post;
        })
      );
      
      // Apply saved interactions from localStorage
      try {
        const savedInteractions = JSON.parse(localStorage.getItem('postInteractions') || '{}');
        
        if (Object.keys(savedInteractions).length > 0) {
          // Create a new array instead of modifying the original to avoid React key issues
          const postsWithInteractions = postsWithCommentCounts.map((post: Post) => {
            if (savedInteractions[post.id] !== undefined) {
              return {
                ...post,
                interaction: savedInteractions[post.id]
              };
            }
            return post;
          });
          setPosts(postsWithInteractions);
        } else {
          setPosts(postsWithCommentCounts);
        }
      } catch (error) {
        console.error('Error loading saved interactions:', error);
        setPosts(postsWithCommentCounts);
      }
    } catch (error) {
      console.error('Error fetching group posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [groupId, categoryId]);

  // Handle category click
  const handleCategoryClick = (id?: string) => {
    if (categoryId === id) {
      // If clicking the currently selected category, remove the filter
      router.push(`/groups/${groupId}/posts`);
    } else if (id) {
      // Otherwise, filter by the selected category
      router.push(`/groups/${groupId}/posts?category=${id}`);
    } else {
      // If id is undefined, show all posts
      router.push(`/groups/${groupId}/posts`);
    }
  };

  // Handle post interaction (like/dislike)
  const handleInteraction = async (postId: string, type: 'like' | 'dislike') => {
    if (!user) {
      // Redirect to login if user is not authenticated
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}/interact`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Interaction error:', errorData);
        throw new Error(errorData.error || 'Failed to interact with post');
      }

      const data = await response.json();
      
      // Update the posts state with the new interaction data
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            // Store interaction in localStorage for persistence
            try {
              const userInteractions = JSON.parse(localStorage.getItem('postInteractions') || '{}');
              userInteractions[postId] = data.interaction;
              localStorage.setItem('postInteractions', JSON.stringify(userInteractions));
            } catch (err) {
              console.error('Error storing interaction in localStorage:', err);
            }
            
            // Return updated post with new interaction data
            return {
              ...post,
              likes: data.likes || post.likes,
              dislikes: data.dislikes || post.dislikes,
              interaction: data.interaction
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('Error interacting with post:', error);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (postId: string) => {
    if (!user) {
      // Redirect to login if user is not authenticated
      router.push('/auth/login');
      return;
    }

    const commentText = commentInputs[postId];
    if (!commentText || commentText.trim() === '') {
      return;
    }

    try {
      // Create form data for the request
      const formData = new FormData();
      formData.append('body', commentText);
      
      // Add media file if it exists
      const mediaFile = commentMediaFiles[postId];
      if (mediaFile) {
        formData.append('media', mediaFile);
      }
      
      console.log(`Submitting comment for post ${postId}`);
      
      const response = await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Comment submission error:', errorData);
        throw new Error(errorData.error || 'Failed to submit comment');
      }

      const newComment = await response.json();
      
      // Add current timestamp to ensure proper date display
      const commentWithProperDate = {
        ...newComment,
        created_at: new Date().toISOString()
      };
      
      // Update the posts state with the new comment
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [...(post.comments || []), commentWithProperDate]
            };
          }
          return post;
        })
      );

      // Clear the comment input and media
      setCommentInputs(prev => ({
        ...prev,
        [postId]: ''
      }));
      
      setCommentMediaFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[postId];
        return newFiles;
      });
      
      setCommentMediaPreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[postId];
        return newPreviews;
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  // Handle comment input change
  const handleCommentChange = (postId: string, value: string) => {
    setCommentInputs(prev => ({
      ...prev,
      [postId]: value
    }));
  };

  // Handle comment media file selection
  const handleCommentMediaChange = (postId: string, files: FileList | null) => {
    if (!files || files.length === 0) {
      setCommentMediaFiles(prev => ({
        ...prev,
        [postId]: null
      }));
      setCommentMediaPreviews(prev => ({
        ...prev,
        [postId]: ''
      }));
      return;
    }

    const file = files[0];
    
    // Check if file is an image or gif
    if (!file.type.startsWith('image/')) {
      alert('Please select an image or GIF file');
      return;
    }
    
    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    
    setCommentMediaFiles(prev => ({
      ...prev,
      [postId]: file
    }));
    
    setCommentMediaPreviews(prev => ({
      ...prev,
      [postId]: previewUrl
    }));
  };

  // Clear comment media
  const clearCommentMedia = (postId: string) => {
    // Revoke the object URL to prevent memory leaks
    if (commentMediaPreviews[postId]) {
      URL.revokeObjectURL(commentMediaPreviews[postId]);
    }
    
    setCommentMediaFiles(prev => ({
      ...prev,
      [postId]: null
    }));
    
    setCommentMediaPreviews(prev => ({
      ...prev,
      [postId]: ''
    }));
  };

  // Toggle comments visibility
  const toggleComments = async (postId: string) => {
    // Toggle expanded state
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));

    // If we're expanding comments and they haven't been loaded yet, fetch them
    const post = posts.find(p => p.id === postId);
    if (!expandedComments[postId] && (!post?.comments || post.comments.length === 0)) {
      try {
        const response = await fetch(`/api/posts/${postId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch post details');
        }
        
        const postData = await response.json();
        
        // Update the posts state with the fetched comments
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                comments: postData.comments || []
              };
            }
            return post;
          })
        );
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all object URLs to prevent memory leaks
      Object.values(commentMediaPreviews).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [commentMediaPreviews]);

  // Format time since post creation
  const timeSince = (dateString: string) => {
    try {
      // Ensure proper date parsing by handling different formats
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Unknown time';
      }
      
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      
      // Handle negative time differences (future dates or clock skew)
      if (seconds < 0) {
        return 'Just now';
      }
      
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + ' years';
      
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + ' months';
      
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + ' days';
      
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + ' hours';
      
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + ' minutes';
      
      return seconds < 10 ? 'Just now' : Math.floor(seconds) + ' seconds';
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Unknown time';
    }
  };

  // Helper function to determine media type
  const getMediaType = (mediaUrl?: string) => {
    if (!mediaUrl) return 'unknown';
    
    try {
      // Check if the URL contains an extension
      const urlParts = mediaUrl.split('.');
      const extension = urlParts.length > 1 ? urlParts.pop()?.toLowerCase() : '';
      
      // Common image extensions
      if (extension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
        return 'image';
      }
      
      // Common video extensions
      if (extension && ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(extension)) {
        return 'video';
      }
      
      // If no extension or unrecognized, try to guess from the URL
      if (mediaUrl.includes('/images/') || mediaUrl.includes('/img/')) {
        return 'image';
      }
      
      if (mediaUrl.includes('/videos/') || mediaUrl.includes('/video/')) {
        return 'video';
      }
      
      // Default to image for unrecognized media
      return 'image';
    } catch (error) {
      console.error('Error determining media type:', error);
      return 'image'; // Default to image on error
    }
  };

  // Format media URL for display
  const formatMediaUrl = (mediaUrl?: string) => {
    if (!mediaUrl) return '';
    
    // If it's already an absolute URL, return it
    if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
      return mediaUrl;
    }
    
    // If it's a relative path with backslashes (Windows style), convert to forward slashes
    if (mediaUrl.includes('\\')) {
      mediaUrl = mediaUrl.replace(/\\/g, '/');
    }
    
    // Extract the filename from the path
    // The backend stores files in "web/storage/filename"
    let filename = mediaUrl;
    
    // Remove leading /web/storage/ or /storage/ if present
    if (mediaUrl.startsWith('/web/storage/')) {
      filename = mediaUrl.substring('/web/storage/'.length);
    } else if (mediaUrl.startsWith('/storage/')) {
      filename = mediaUrl.substring('/storage/'.length);
    } else if (mediaUrl.startsWith('/')) {
      // If it starts with a slash, remove it
      filename = mediaUrl.substring(1);
    }
    
    // If the filename still contains a path like "storage/filename", extract just the filename
    if (filename.includes('storage/')) {
      filename = filename.substring(filename.indexOf('storage/') + 'storage/'.length);
    }
    
    // Return the URL to our media API route
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/media/${filename}`;
  };

  if (!posts || !posts.length) {
    return (
      <div className="container mx-auto px-1.5 sm:px-3 py-3 sm:py-6 min-h-[calc(100vh-7rem)]">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
          <h2 className="text-lg sm:text-xl font-bold text-white">Group Posts</h2>
          {user ? (
            <button 
              onClick={() => router.push(`/groups/${groupId}/posts/create`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-md flex items-center font-bold text-xs sm:text-sm w-full sm:w-auto justify-center"
            >
              + Create Post
            </button>
          ) : (
            <button 
              onClick={() => router.push('/auth/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-md flex items-center font-bold text-xs sm:text-sm w-full sm:w-auto justify-center"
            >
              Login to Create Post
            </button>
          )}
        </div>

        {/* Category filters */}
        <div className="flex flex-col items-center mb-3 sm:mb-4">
          {filterCategories.length === 0 ? (
            <div className="text-center p-2 sm:p-3 bg-gray-800 rounded mb-2 sm:mb-3 w-full max-w-md">
              <p className="text-white mb-1 text-xs sm:text-sm">No categories available.</p>
            </div>
          ) : (
            <div className="flex gap-1 sm:gap-1.5 mb-1.5 flex-wrap justify-center">
              {filterCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full text-xs ${
                    categoryId === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-lg">
            <p className="text-gray-300 mb-3">No group posts found.</p>
            {user && (
              <button
                onClick={() => router.push(`/groups/${groupId}/posts/create`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md inline-flex items-center text-sm"
              >
                Create your first group post
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Main posts display
  return (
    <div className="container mx-auto px-1.5 sm:px-3 py-3 sm:py-6 min-h-[calc(100vh-7rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
        <h2 className="text-lg sm:text-xl font-bold text-white">Group Posts</h2>
        {user ? (
          <button 
            onClick={() => router.push(`/groups/${groupId}/posts/create`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-md flex items-center font-bold text-xs sm:text-sm w-full sm:w-auto justify-center"
          >
            + Create Post
          </button>
        ) : (
          <button 
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-md flex items-center font-bold text-xs sm:text-sm w-full sm:w-auto justify-center"
          >
            Login to Create Post
          </button>
        )}
      </div>

      {/* Category filters */}
      <div className="flex flex-col items-center mb-3 sm:mb-4">
        {filterCategories.length === 0 ? (
          <div className="text-center p-2 sm:p-3 bg-gray-800 rounded mb-2 sm:mb-3 w-full max-w-md">
            <p className="text-white mb-1 text-xs sm:text-sm">No categories available.</p>
          </div>
        ) : (
          <div className="flex gap-1 sm:gap-1.5 mb-1.5 flex-wrap justify-center">
            <button
              onClick={() => handleCategoryClick(undefined)}
              className={`px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full text-xs ${
                !categoryId
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            {filterCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full text-xs ${
                  categoryId === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden shadow-md">
              {/* Post header with user info */}
              <div className="flex items-center p-2.5 sm:p-3 border-b border-gray-700">
                <div className="flex-shrink-0">
                  <img 
                    src={post.author?.avatar || '/default-avatar.png'} 
                    alt={post.author?.username || 'User'} 
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover"
                  />
                </div>
                <div className="ml-2 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-xs sm:text-sm font-medium truncate">
                        {post.author?.username || 'Anonymous'}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {timeSince(post.created_at)}
                      </p>
                    </div>
                    {post.category && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {post.category.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Post content */}
              <div className="p-2.5 sm:p-3 text-white">
                <p className="text-xs sm:text-sm mb-2 whitespace-pre-wrap">{post.content}</p>
                
                {/* Post media */}
                {post.media && (
                  <div className="mt-2 rounded-md overflow-hidden bg-gray-800">
                    {getMediaType(post.media) === 'image' ? (
                      <img
                        src={formatMediaUrl(post.media)}
                        alt="Post media"
                        className="w-full h-auto max-h-96 object-contain"
                        loading="lazy"
                      />
                    ) : getMediaType(post.media) === 'video' ? (
                      <video
                        src={formatMediaUrl(post.media)}
                        controls
                        className="w-full h-auto max-h-96"
                      />
                    ) : null}
                  </div>
                )}

                {/* Post interaction buttons */}
                <div className="flex items-center justify-between mt-3 text-gray-400">
                  <div className="flex space-x-2 sm:space-x-3">
                    {/* Like button */}
                    <button
                      onClick={() => handleInteraction(post.id, 'like')}
                      className={`flex items-center space-x-1 ${post.interaction === 'like' ? 'text-blue-500' : ''}`}
                      disabled={loading}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 sm:h-5 sm:w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                        />
                      </svg>
                      <span className="text-xs sm:text-sm">{post.likes || 0}</span>
                    </button>

                    {/* Dislike button */}
                    <button
                      onClick={() => handleInteraction(post.id, 'dislike')}
                      className={`flex items-center space-x-1 ${post.interaction === 'dislike' ? 'text-red-500' : ''}`}
                      disabled={loading}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 sm:h-5 sm:w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
                        />
                      </svg>
                      <span className="text-xs sm:text-sm">{post.dislikes || 0}</span>
                    </button>

                    {/* Comment button */}
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center space-x-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 sm:h-5 sm:w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span className="text-xs sm:text-sm">
                        {post.comments ? post.comments.length : 0}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments section */}
              {expandedComments[post.id] && (
                <div className="border-t border-gray-700 p-2.5 sm:p-3">
                  {/* Comment list */}
                  {post.comments && post.comments.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-2">
                          <div className="flex-shrink-0">
                            <img
                              src={comment.author?.avatar || '/default-avatar.png'}
                              alt={comment.author?.username || 'User'}
                              className="h-6 w-6 sm:h-7 sm:w-7 rounded-full object-cover"
                            />
                          </div>
                          <div className="flex-1 bg-gray-800 rounded-lg p-2">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-white text-xs font-medium">
                                {comment.author?.username || 'Anonymous'}
                              </p>
                              <p className="text-gray-400 text-xs">
                                {timeSince(comment.created_at)}
                              </p>
                            </div>
                            <p className="text-white text-xs sm:text-sm whitespace-pre-wrap">
                              {(comment.content as string) || (comment.body as string) || ''}
                            </p>
                            {comment.media && (
                              <div className="mt-1.5 rounded-md overflow-hidden bg-gray-900">
                                {getMediaType(comment.media) === 'image' ? (
                                  <img
                                    src={formatMediaUrl(comment.media)}
                                    alt="Comment media"
                                    className="w-full h-auto max-h-60 object-contain"
                                    loading="lazy"
                                  />
                                ) : getMediaType(comment.media) === 'video' ? (
                                  <video
                                    src={formatMediaUrl(comment.media)}
                                    controls
                                    className="w-full h-auto max-h-60"
                                  />
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-xs sm:text-sm mb-3">No comments yet.</p>
                  )}

                  {/* Comment form */}
                  {user ? (
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <div className="flex-shrink-0">
                          <img
                            src={typeof user.avatar === 'string' ? user.avatar : '/default-avatar.png'}
                            alt={typeof user.username === 'string' ? user.username : 'User'}
                            className="h-6 w-6 sm:h-7 sm:w-7 rounded-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => handleCommentChange(post.id, e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full bg-gray-800 text-white rounded-lg p-2 text-xs sm:text-sm resize-none focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            rows={2}
                          />
                          
                          {/* Media preview */}
                          {commentMediaPreviews[post.id] && (
                            <div className="relative mt-1.5 rounded-md overflow-hidden bg-gray-900 w-24 h-24">
                              <img
                                src={commentMediaPreviews[post.id]}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={() => clearCommentMedia(post.id)}
                                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              </button>
                            </div>
                          )}
                          
                          <div className="flex justify-between mt-1.5">
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleCommentMediaChange(post.id, e.target.files)}
                                className="hidden"
                              />
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </label>
                            <button
                              onClick={() => handleCommentSubmit(post.id)}
                              disabled={!commentInputs[post.id] || commentInputs[post.id].trim() === ''}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => router.push('/auth/login')}
                      className="w-full bg-gray-800 hover:bg-gray-700 text-white py-1.5 rounded-lg text-xs sm:text-sm"
                    >
                      Login to comment
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
