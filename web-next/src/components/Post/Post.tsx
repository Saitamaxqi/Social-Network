'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Post {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
  };
  categories: Array<{
    id: string;
    name: string;
  }>;
  created_at: string;
  likes: number;
  dislikes: number;
}

interface PostProps {
  post?: Post;
  categoryId?: string;
}

export default function Post({ post, categoryId }: PostProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState([]);
  const [filterCategories, setFilterCategories] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [categoryId]);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts' + (categoryId ? `?category=${categoryId}` : ''));
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setFilterCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/posts?category=${categoryId}`);
  };

  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    
    if (interval > 1) return Math.floor(interval) + " years";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes";
    return Math.floor(seconds) + " seconds";
  };

  return (
    <div className="container mx-auto px-4">
      <h2 className="text-2xl font-bold mb-6">Posts</h2>
      
      {/* Category filters */}
      <div className="flex gap-2 mb-6 flex-wrap justify-center">
        {filterCategories.map((category: any) => (
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

      {/* Posts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{post.author.username}</h3>
              <span className="text-sm text-gray-500">
                {timeSince(post.created_at)} ago
              </span>
            </div>
            <p className="text-gray-700 mb-4">{post.content}</p>
            <div className="flex gap-2 flex-wrap">
              {post.categories.map((category) => (
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
                <span>👍</span> {post.likes}
              </button>
              <button className="flex items-center gap-1">
                <span>👎</span> {post.dislikes}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
