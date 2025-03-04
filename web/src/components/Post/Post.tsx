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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Posts</h2>
          {user ? (
            <button 
              onClick={() => router.push('/posts/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center font-bold"
            >
              + Create Post
            </button>
          ) : (
            <button 
              onClick={() => router.push('/auth/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center font-bold"
            >
              Login to Create Post
            </button>
          )}
        </div>

        {/* Category filters */}
        <div className="flex flex-col items-center mb-6">
          {filterCategories.length === 0 ? (
            <div className="text-center p-4 bg-gray-800 rounded mb-4 w-full max-w-md">
              <p className="text-white mb-2">No categories available.</p>
            </div>
          ) : (
            <div className="flex gap-2 mb-2 flex-wrap justify-center">
              {filterCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`px-4 py-2 rounded-full ${
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

        <div className="text-center text-white p-8 bg-gray-800 rounded-lg">
          <p className="text-xl">No posts available to display.</p>
          <p className="mt-2">Check back later or try a different category.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Posts</h2>
        {user ? (
          <button 
            onClick={() => router.push('/posts/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center font-bold"
          >
            + Create Post
          </button>
        ) : (
          <button 
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center font-bold"
          >
            Login to Create Post
          </button>
        )}
      </div>

      {/* Post listing */}
      <div className="space-y-6">
        {/* Category filters */}
        <div className="flex flex-col items-center mb-6">
          {filterCategories.length === 0 ? (
            <div className="text-center p-4 bg-gray-800 rounded mb-4 w-full max-w-md">
              <p className="text-white mb-2">No categories available.</p>
            </div>
          ) : (
            <div className="flex gap-2 mb-2 flex-wrap justify-center">
              {filterCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`px-4 py-2 rounded-full ${
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

        {/* Posts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{post.author?.username || 'Unknown User'}</h3>
                <span className="text-sm text-gray-500">
                  {post.created_at ? timeSince(post.created_at) + ' ago' : 'Unknown time'}
                </span>
              </div>
              <p className="text-gray-700 mb-4">{post.content || 'No content'}</p>
              <div className="flex gap-2 flex-wrap">
                {post.categories && post.categories.map((category) => (
                  <span
                    key={category.id}
                    className="bg-gray-100 px-2 py-1 rounded-full text-sm"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
              <div className="flex gap-4 mt-4">
                <button className="flex items-center gap-1">
                  <span>👍</span> {post.likes || 0}
                </button>
                <button className="flex items-center gap-1">
                  <span>👎</span> {post.dislikes || 0}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
