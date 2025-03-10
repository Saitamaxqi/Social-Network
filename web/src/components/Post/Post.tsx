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
  created_at?: string;
  author?: Author;
  categories?: Category[];
  likes?: number;
  dislikes?: number;
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
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [fetchCategories, fetchPosts, categoryId, user]);

  const handleCategoryClick = useCallback((categoryId: string) => {
    router.push(`/posts?category=${categoryId}`);
  }, [router]);

  // Helper function to format time
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

        <div className="text-center text-white p-4 sm:p-8 bg-gray-800 rounded-lg">
          <p className="text-lg sm:text-xl">No posts available to display.</p>
          <p className="mt-2 text-sm sm:text-base">Check back later or try a different category.</p>
        </div>
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
          {posts.map((post) => (
            <div
              key={post.id}
              className="border rounded-lg p-4 sm:p-6 hover:shadow-lg transition-shadow bg-white/5 backdrop-blur-sm w-full"
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
              
              <div className="flex gap-1.5 sm:gap-2 flex-wrap mb-4">
                {post.categories && post.categories.map((category) => (
                  <span
                    key={category.id}
                    className="bg-gray-700/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm text-gray-200"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
              
              <div className="flex gap-4 sm:gap-6 mt-2">
                <button className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors">
                  <span className="text-lg">👍</span> <span className="text-sm sm:text-base">{post.likes || 0}</span>
                </button>
                <button className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors">
                  <span className="text-lg">👎</span> <span className="text-sm sm:text-base">{post.dislikes || 0}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
