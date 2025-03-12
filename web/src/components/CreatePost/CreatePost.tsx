import { useState, useRef, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import Image from 'next/image';

interface Category {
  id: number;
  name: string;
}

export default function CreatePost() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('body', content);
      // Convert category IDs to comma-separated string
      if (selectedCategoryIds.length > 0) {
        formData.append('categories', selectedCategoryIds.join(','));
      }
      if (media) {
        formData.append('media', media);
      }

      const response = await fetch('/api/createpost', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create post');
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
          Create New Post
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
            placeholder="Enter post title"
            className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-600 bg-black/30 backdrop-blur-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200 mb-2">Categories</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            {isLoading ? (
              <div className="col-span-1 sm:col-span-2 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : categories.map((category) => (
              <Switch.Group key={category.id}>
                <div className="flex items-center">
                  <Switch
                    checked={selectedCategoryIds.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className={`${
                      selectedCategoryIds.includes(category.id) ? 'bg-indigo-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        selectedCategoryIds.includes(category.id) ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                  <Switch.Label className="ml-3 text-sm text-gray-200">{category.name}</Switch.Label>
                </div>
              </Switch.Group>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post content..."
            className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-600 bg-black/30 backdrop-blur-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 sm:h-32"
            required
          />
        </div>

        <div className="space-y-2 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Media (Optional)</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setMedia(file);
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setMediaPreview(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Select Media
              </button>
              {media && (
                <span className="text-sm text-gray-300 truncate max-w-full">
                  {media.name} ({(media.size / 1024).toFixed(2)} KB)
                </span>
              )}
            </div>
          </div>

          {mediaPreview && (
            <div className="mt-2 relative rounded-lg overflow-hidden">
              {media?.type.startsWith('image/') ? (
                <div className="relative w-full h-48 sm:h-64">
                  <Image
                    src={mediaPreview}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : media?.type.startsWith('video/') ? (
                <video
                  src={mediaPreview}
                  controls
                  className="w-full max-h-48 sm:max-h-64 rounded-lg"
                />
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setMedia(null);
                  setMediaPreview('');
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                aria-label="Remove media"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="pt-2 sm:pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                <span>Creating Post...</span>
              </div>
            ) : (
              'Create Post'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
