import React, { useState, useEffect, useCallback } from 'react';
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
}

interface Post {
  id: string;
  title?: string;
  content?: string;
  body?: string;
  media?: string;
  created_at?: string;
  author?: Author;
  user?: Author;
  categories?: Category[];
  likes?: number;
  dislikes?: number;
  interaction?: number;
  comments?: Post[];
  post_id?: string;
  visibility?: string;
  groupId?: string;
}

interface PostProps {
  groupId?: string;
  scrollToPostId?: string | null;
}

export default function Post({ groupId, scrollToPostId }: PostProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentMediaFiles, setCommentMediaFiles] = useState<Record<string, File | null>>({});
  const [commentMediaPreviews, setCommentMediaPreviews] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const router = useRouter();



  // Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const url = groupId ? `/api/groups/${groupId}/posts` : '/api/posts';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
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
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [groupId]);



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
  const getMediaType = (mediaUrl?: string | null) => {
    if (!mediaUrl || typeof mediaUrl !== 'string') return 'unknown';
    
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
  const formatMediaUrl = (mediaUrl?: string | null) => {
    if (!mediaUrl || typeof mediaUrl !== 'string') return '';
    
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
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 min-h-[calc(100vh-7rem)]">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Posts</h2>
          {user ? (
            <button 
              onClick={() => router.push('/posts/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md flex items-center font-bold text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              + Create Post
            </button>
          ) : (
            <button 
              onClick={() => router.push('/auth/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md flex items-center font-bold text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              Login to Create Post
            </button>
          )}
        </div>



        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="text-center p-8 bg-white/5 backdrop-blur-sm rounded-lg">
            <p className="text-gray-300 mb-4">No posts found.</p>
            {user && (
              <button
                onClick={() => router.push('/posts/create')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center"
              >
                Create your first post
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 min-h-[calc(100vh-7rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Posts</h2>
        {user ? (
          <button 
            onClick={() => router.push('/posts/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md flex items-center font-bold text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            + Create Post
          </button>
        ) : (
          <button 
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md flex items-center font-bold text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            Login to Create Post
          </button>
        )}
      </div>

      {/* Post listing */}
      <div className="space-y-4 sm:space-y-6">


        {/* Posts list */}
        <div className="flex flex-col gap-4 sm:gap-6 pb-8">
          {posts.map((post, index) => (
            <div
              key={post.id}
              id={`post-${post.id}`}
              className={`border border-gray-700 rounded-lg p-4 sm:p-6 hover:shadow-lg transition-shadow bg-white/5 backdrop-blur-sm w-full ${scrollToPostId === post.id ? 'highlight-post' : ''}`}
            >
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base sm:text-xl text-white">{post.author?.username || post.user?.username || 'Unknown User'}</h3>
                  {/* Visibility indicator */}
                  {post.visibility && (
                    <span className="flex items-center text-xs text-gray-400" title={`Visibility: ${post.visibility}`}>
                      {post.visibility === 'public' && (
                        <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                      )}
                      {post.visibility === 'private' && (
                        <LockClosedIcon className="h-4 w-4 text-gray-400" />
                      )}
                      {post.visibility === 'close_friends' && (
                        <UserGroupIcon className="h-4 w-4 text-blue-400" />
                      )}
                    </span>
                  )}
                </div>
                <span className="text-xs sm:text-sm text-gray-400">
                  {post.created_at ? timeSince(post.created_at) + ' ago' : 'Unknown time'}
                </span>
              </div>
              
              {post.title && (
                <h4 className="text-lg sm:text-xl font-medium text-white mb-2 sm:mb-3">{post.title}</h4>
              )}
              
              <p className="text-gray-300 mb-4 sm:mb-5 text-sm sm:text-base leading-relaxed">{post.content || post.body || 'No content'}</p>
              
              {/* Media display - always show media directly */}
              {post.media && (
                <div className="mb-4 sm:mb-5 rounded-lg overflow-hidden">
                  {getMediaType(post.media) === 'image' ? (
                    <div className="w-full max-h-96 bg-black/20 flex justify-center">
                      <img 
                        src={formatMediaUrl(post.media)} 
                        alt={post.title || "Post image"} 
                        className="object-contain max-h-96 rounded-lg"
                        onError={(e) => {
                          console.error('Image failed to load:', post.media);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : getMediaType(post.media) === 'video' ? (
                    <video 
                      src={formatMediaUrl(post.media)} 
                      controls 
                      className="w-full rounded-lg max-h-96 bg-black/20"
                      onError={(e) => {
                        console.error('Video failed to load:', post.media);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full max-h-96 bg-black/20 flex justify-center">
                      <img 
                        src={formatMediaUrl(post.media)} 
                        alt={post.title || "Post image"} 
                        className="object-contain max-h-96 rounded-lg"
                        onError={(e) => {
                          console.error('Media failed to load:', post.media);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex gap-1.5 sm:gap-2 mb-2 flex-wrap justify-center">
                {post.categories && post.categories.map((category) => (
                  <span
                    key={category.id}
                    className="px-2 py-1 bg-gray-700 text-gray-200 rounded-full text-xs"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <button 
                  onClick={() => handleInteraction(post.id, 'like')}
                  className={`flex items-center gap-1.5 transition-colors ${
                    post.interaction === 1 
                      ? 'text-blue-500' 
                      : 'text-gray-300 hover:text-blue-400'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={post.interaction === 1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  <span>{post.likes || 0}</span>
                </button>
                <button 
                  onClick={() => handleInteraction(post.id, 'dislike')}
                  className={`flex items-center gap-1.5 transition-colors ${
                    post.interaction === -1 
                      ? 'text-red-500' 
                      : 'text-gray-300 hover:text-red-400'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={post.interaction === -1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.904a3.61 3.61 0 01-.608-2.006L13 11v-3m0 0v-3m0 0v-3m0 0V5" />
                  </svg>
                  <span>{post.dislikes || 0}</span>
                </button>
                <button 
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1.5 text-gray-300 hover:text-blue-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span>{post.comments?.length || 0} Comments</span>
                </button>
              </div>

              {/* Comment section */}
              <div className="mt-4 border-t border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <button 
                    onClick={() => toggleComments(post.id)}
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    {expandedComments[post.id] ? 'Hide Comments' : `${post.comments?.length || 0} Comments`}
                  </button>
                </div>
                
                {expandedComments[post.id] && (
                  <div className="space-y-4">
                    {/* Comment list */}
                    {post.comments && post.comments.length > 0 ? (
                      <div className="space-y-3">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="bg-gray-800 rounded p-3">
                            <div className="flex items-center mb-1">
                              <span className="font-semibold text-sm">{comment.author?.username || 'Unknown User'}</span>
                              <span className="text-xs text-gray-400 ml-2">
                                {comment.created_at ? timeSince(comment.created_at) + ' ago' : 'Just now'}
                              </span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                            {comment.media && (
                              <div className="mt-2">
                                <img 
                                  src={comment.media.startsWith('http') ? comment.media : `http://localhost:8080${comment.media}`} 
                                  alt="Comment media" 
                                  className="max-h-60 rounded object-contain"
                                  onError={(e) => {
                                    console.error("Error loading image:", comment.media);
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = '/placeholder-image.png';
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No comments yet. Be the first to comment!</p>
                    )}
                    
                    {/* Comment input */}
                    <div className="mt-3">
                      <div className="flex flex-col space-y-2">
                        <textarea
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => handleCommentChange(post.id, e.target.value)}
                          placeholder="Write a comment..."
                          className="w-full bg-gray-700 text-white rounded p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={2}
                        />
                        
                        {/* Media preview */}
                        {commentMediaPreviews[post.id] && (
                          <div className="relative inline-block">
                            <img 
                              src={commentMediaPreviews[post.id]} 
                              alt="Comment media preview" 
                              className="max-h-40 rounded"
                            />
                            <button 
                              onClick={() => clearCommentMedia(post.id)}
                              className="absolute top-1 right-1 bg-gray-800 rounded-full p-1 hover:bg-gray-700"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <label className="cursor-pointer text-blue-400 hover:text-blue-300 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm">Add Image/GIF</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handleCommentMediaChange(post.id, e.target.files)}
                            />
                          </label>
                          
                          <button
                            onClick={() => handleCommentSubmit(post.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
