import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useGroup } from '@/contexts/GroupContext';

interface Category {
  id: number;
  name: string;
}

export default function CreateGroupPost() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentGroupId } = useGroup();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        if (data.message) {
          throw new Error(data.message);
        }
        setCategories(data || []);
      } catch (error) {
        setError('Failed to load categories. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategoryIds(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
    
    // Update selectedCategories with category names for the API
    const selectedNames = categories
      .filter(cat => selectedCategoryIds.includes(cat.id))
      .map(cat => cat.name);
    setSelectedCategories(selectedNames);
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMedia(file);
      const previewUrl = URL.createObjectURL(file);
      setMediaPreview(previewUrl);
    }
  };

  const removeMedia = () => {
    setMedia(null);
    setMediaPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || !currentGroupId) return;
    
    // Validate form
    if (!content.trim()) {
      setSubmitError('Please enter some content for your post');
      return;
    }
    
    if (selectedCategoryIds.length === 0) {
      setSubmitError('Please select at least one category');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const formData = new FormData();
      
      // Add title if provided
      if (title.trim()) {
        formData.append('title', title);
      }
      
      // Add content as body
      formData.append('body', content);
      
      // Convert category IDs to comma-separated string
      if (selectedCategoryIds.length > 0) {
        formData.append('categories', selectedCategoryIds.join(','));
      }
      
      // Add media if provided
      if (media) {
        formData.append('media', media);
      }

      console.log('Submitting group post with data:', {
        title,
        content,
        categories: selectedCategoryIds.join(','),
        hasMedia: !!media
      });

      // Use the API route that forwards cookies to the backend
      const response = await fetch(`/api/groups/${currentGroupId}/posts`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create post');
      }

      // Reset form
      setTitle('');
      setContent('');
      setSelectedCategories([]);
      setSelectedCategoryIds([]);
      setMedia(null);
      setMediaPreview('');
      setSubmitSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      <div className="text-center mb-4 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Create New Group Post
        </h2>
        {error && (
          <div className="mt-4 rounded-md bg-red-500/20 backdrop-blur-sm p-3 sm:p-4">
            <div className="text-sm text-red-200">{error}</div>
          </div>
        )}
        {submitError && (
          <div className="mt-4 rounded-md bg-red-500/20 backdrop-blur-sm p-3 sm:p-4">
            <div className="text-sm text-red-200">{submitError}</div>
          </div>
        )}
        {submitSuccess && (
          <div className="mt-4 rounded-md bg-green-500/20 backdrop-blur-sm p-3 sm:p-4">
            <div className="text-sm text-green-200">Post created successfully!</div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a title (optional)"
            className="w-full px-3 py-2 bg-black/30 backdrop-blur-sm border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">Content*</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            className="w-full px-3 py-2 bg-black/30 backdrop-blur-sm border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">Categories*</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategoryToggle(category.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategoryIds.includes(category.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-black/30 backdrop-blur-sm text-gray-200 hover:bg-black/50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">Media</label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleMediaChange}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black/30 file:text-gray-200 hover:file:bg-black/40"
          />
          {mediaPreview && (
            <div className="mt-4 relative inline-block">
              <Image
                src={mediaPreview}
                alt="Media preview"
                width={200}
                height={200}
                className="rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={removeMedia}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
