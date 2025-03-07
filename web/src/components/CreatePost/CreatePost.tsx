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
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white">
          Create New Post
        </h2>
        {error && (
          <div className="mt-4 rounded-md bg-red-500/20 backdrop-blur-sm p-4">
            <div className="text-sm text-red-200">{error}</div>
          </div>
        )}
        {submitError && (
          <div className="mt-4 rounded-md bg-red-500/20 backdrop-blur-sm p-4">
            <div className="text-sm text-red-200">{submitError}</div>
          </div>
        )}
        {submitSuccess && (
          <div className="mt-4 rounded-md bg-green-500/20 backdrop-blur-sm p-4">
            <div className="text-sm text-green-200">Post created successfully!</div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
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
          <div className="grid grid-cols-2 gap-4">
            {isLoading ? (
              <div className="col-span-2 flex justify-center">
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
            className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-600 bg-black/30 backdrop-blur-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
            required
          />
        </div>

        <div className="space-y-4">
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
            <div className="mt-1 flex items-center space-x-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm font-medium text-gray-200 border border-gray-600 bg-black/30 backdrop-blur-sm rounded-md hover:bg-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                Upload Media
              </button>
              {media && (
                <button
                  type="button"
                  onClick={() => {
                    setMedia(null);
                    setMediaPreview('');
                  }}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
            {mediaPreview && (
              <div className="mt-2 relative w-full h-48">
                {media?.type.startsWith('image/') ? (
                  <Image
                    src={mediaPreview}
                    alt="Preview"
                    fill
                    className="object-contain rounded-lg"
                  />
                ) : (
                  <video
                    src={mediaPreview}
                    controls
                    className="w-full h-full rounded-lg"
                  />
                )}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Creating Post...
              </>
            ) : (
              'Create Post'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
