'use client';

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/Layout/MainLayout';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
}

export default function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();
  const { user } = useAuth();

  // Fetch categories on component mount
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Failed to load categories. Please try again later.');
      }
    };

    fetchCategories();
  }, [user, router]);

  // Handle category selection
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Handle media file selection
  const handleMediaChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setMediaFile(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setMediaPreview(null);
    }
  };

  // Handle media removal
  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a post');
      return;
    }
    
    if (!title.trim() && !content.trim()) {
      setError('Please provide either a title or content for your post');
      return;
    }
    
    if (selectedCategories.length === 0) {
      setError('Please select at least one category');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      
      // Append each category ID separately
      selectedCategories.forEach(categoryId => {
        formData.append('categories', categoryId);
      });
      
      if (mediaFile) {
        formData.append('media', mediaFile);
      }
      
      console.log('Submitting form data:', {
        title,
        content,
        categories: selectedCategories,
        hasMedia: !!mediaFile
      });
      
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create post');
      }
      
      setSuccess(true);
      
      // Reset form
      setTitle('');
      setContent('');
      setSelectedCategories([]);
      setMediaFile(null);
      setMediaPreview(null);
      
      // Redirect to posts page after a short delay
      setTimeout(() => {
        router.push('/posts');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // If user is not authenticated, show loading state
  if (!user) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur-sm p-6 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-6 text-white">Create a New Post</h1>
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-md">
              <p className="text-red-500">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-md">
              <p className="text-green-500">Post created successfully! Redirecting...</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
                Title (Optional)
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                placeholder="Enter a title for your post"
              />
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-1">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                placeholder="What's on your mind?"
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Categories (Select at least one)
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.length === 0 ? (
                  <p className="text-gray-400 text-sm">Loading categories...</p>
                ) : (
                  categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryChange(category.id)}
                      className={`px-3 py-1.5 rounded-full text-sm ${
                        selectedCategories.includes(category.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Media (Optional)
              </label>
              <div className="flex flex-col space-y-3">
                <div className="flex items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleMediaChange}
                    accept="image/*,video/*"
                    className="hidden"
                    id="media-upload"
                  />
                  <label
                    htmlFor="media-upload"
                    className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md cursor-pointer hover:bg-gray-600 transition-colors"
                  >
                    Select Image or Video
                  </label>
                  {mediaFile && (
                    <button
                      type="button"
                      onClick={handleRemoveMedia}
                      className="ml-3 text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                {mediaPreview && (
                  <div className="mt-3 max-w-md">
                    {mediaFile?.type.startsWith('image/') ? (
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="max-h-60 rounded-md object-contain bg-black/20"
                      />
                    ) : mediaFile?.type.startsWith('video/') ? (
                      <video
                        src={mediaPreview}
                        controls
                        className="max-h-60 w-full rounded-md bg-black/20"
                      ></video>
                    ) : null}
                    <p className="mt-1 text-sm text-gray-400">{mediaFile?.name}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.push('/posts')}
                className="px-4 py-2 bg-gray-700 text-white rounded-md mr-3 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                  (loading || success) && 'opacity-70 cursor-not-allowed'
                }`}
              >
                {loading ? 'Creating...' : 'Create Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
