import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

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
  media?: string;
  created_at?: string;
  author?: Author;
  categories?: Category[];
  likes?: number;
  dislikes?: number;
  interaction?: number;
}

interface PostProps {
  categoryId?: string;
}

export default function Post({ categoryId }: PostProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filterCategories, setFilterCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const url = categoryId 
        ? `/api/posts?category=${categoryId}` 
        : '/api/posts';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const data = await response.json();
      
      // Apply saved interactions from localStorage
      try {
        const savedInteractions = JSON.parse(localStorage.getItem('postInteractions') || '{}');
        
        if (Object.keys(savedInteractions).length > 0) {
          // Create a new array instead of modifying the original to avoid React key issues
          const postsWithInteractions = data.map((post: Post) => {
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
          setPosts(data);
        }
      } catch (error) {
        console.error('Error loading saved interactions:', error);
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  // Handle category click
  const handleCategoryClick = (id: string) => {
    if (categoryId === id) {
      // If clicking the currently selected category, remove the filter
      router.push('/posts');
    } else {
      // Otherwise, filter by the selected category
      router.push(`/posts?category=${id}`);
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
        throw new Error('Failed to interact with post');
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
            } catch (error) {
              console.error('Error storing interaction in localStorage:', error);
            }
            
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

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Format time since post creation
  const timeSince = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
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
    
    return Math.floor(seconds) + ' seconds';
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

        {/* Category filters */}
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          {filterCategories.length === 0 ? (
            <div className="text-center p-3 sm:p-4 bg-gray-800 rounded mb-3 sm:mb-4 w-full max-w-md">
              <p className="text-white mb-1 sm:mb-2 text-sm sm:text-base">No categories available.</p>
            </div>
          ) : (
            <div className="flex gap-1.5 sm:gap-2 mb-2 flex-wrap justify-center">
              {filterCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm ${
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
        {/* Category filters */}
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          {filterCategories.length === 0 ? (
            <div className="text-center p-3 sm:p-4 bg-gray-800 rounded mb-3 sm:mb-4 w-full max-w-md">
              <p className="text-white mb-1 sm:mb-2 text-sm sm:text-base">No categories available.</p>
            </div>
          ) : (
            <div className="flex gap-1.5 sm:gap-2 mb-2 flex-wrap justify-center">
              {filterCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm ${
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

        {/* Posts list */}
        <div className="flex flex-col gap-4 sm:gap-6 pb-8">
          {posts.map((post, index) => (
            <div
              key={post.id}
              className="border border-gray-700 rounded-lg p-4 sm:p-6 hover:shadow-lg transition-shadow bg-white/5 backdrop-blur-sm w-full"
            >
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <h3 className="font-semibold text-base sm:text-xl text-white">{post.author?.username || 'Unknown User'}</h3>
                <span className="text-xs sm:text-sm text-gray-400">
                  {post.created_at ? timeSince(post.created_at) + ' ago' : 'Unknown time'}
                </span>
              </div>
              
              {post.title && (
                <h4 className="text-lg sm:text-xl font-medium text-white mb-2 sm:mb-3">{post.title}</h4>
              )}
              
              <p className="text-gray-300 mb-4 sm:mb-5 text-sm sm:text-base leading-relaxed">{post.content || 'No content'}</p>
              
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
              
              <div className="flex gap-1.5 sm:gap-2 flex-wrap mb-4">
                {post.categories && post.categories.map((category) => (
                  <span
                    key={category.id}
                    className="px-2 py-1 bg-gray-700 text-gray-200 rounded-full text-xs"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center gap-4">
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
                  </svg>
                  <span>{post.dislikes || 0}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
