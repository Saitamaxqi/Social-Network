'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/Layout/MainLayout';

export default function CreatePostPage() {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    categories: [] as string[]
  });
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<boolean>(false);
  const { user } = useAuth();
  const router = useRouter();

  // Fetch categories when the component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title.trim()) {
      setFormError('Title is required');
      return;
    }
    
    if (!formData.body.trim()) {
      setFormError('Content is required');
      return;
    }
    
    if (formData.categories.length === 0) {
      setFormError('Please select at least one category');
      return;
    }
    
    try {
      setFormError(null);
      
      // Create FormData object
      const postFormData = new FormData();
      postFormData.append('title', formData.title);
      postFormData.append('body', formData.body);
      
      // Append each category
      formData.categories.forEach(categoryId => {
        postFormData.append('categories', categoryId);
      });
      
      // Submit the form data
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        body: postFormData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create post');
      }
      
      // Show success message
      setFormSuccess(true);
      
      // Reset form
      setFormData({
        title: '',
        body: '',
        categories: []
      });
      
      // Redirect to posts page after a delay
      setTimeout(() => {
        router.push('/posts');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating post:', error);
      setFormError(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => {
      const categories = [...prev.categories];
      const index = categories.indexOf(categoryId);
      
      if (index === -1) {
        categories.push(categoryId);
      } else {
        categories.splice(index, 1);
      }
      
      return {
        ...prev,
        categories
      };
    });
  };

  // If user is not authenticated, redirect to login
  if (!user) {
    return (
      <MainLayout>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6">You must be logged in to create a post.</p>
          <button 
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-bold"
          >
            Login
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Post</h2>
        
        {formError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {formError}
          </div>
        )}
        
        {formSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Post created successfully! Redirecting to posts page...
          </div>
        )}
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <form onSubmit={handleCreatePost}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter post title"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="body" className="block text-gray-700 font-medium mb-2">
                Content
              </label>
              <textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({...formData, body: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your post content here..."
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Categories
              </label>
              {loading ? (
                <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
              ) : categories.length === 0 ? (
                <div className="text-center p-4 bg-gray-100 rounded">
                  <p className="text-gray-700 mb-2">No categories available.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <label key={category.id} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category.id)}
                        onChange={() => handleCategoryChange(category.id)}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                      <span className="ml-2 text-gray-700">{category.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.push('/posts')}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Create Post
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
