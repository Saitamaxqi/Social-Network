//not working yet


import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, ChangeEvent, FormEvent } from "react";

interface Profile {
  id: number;
  username: string;
  date_of_birth: string;
  gender: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_type: string;
  about_me?: string;
  avatar: { String: string; Valid: boolean };
}

export function EditProfilePage() {
  console.log('EditProfilePage component rendering');
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        console.log('Fetching current user profile');
        
        // Get the current user's profile directly
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/check-session`, {
          credentials: "include",
        });
        
        if (!response.ok) {
          console.error('Session check failed with status:', response.status);
          throw new Error("Not authenticated");
        }
        
        const userData = await response.json();
        console.log('User data received:', userData);
        
        if (userData && userData.id) {
          // Store the user ID for redirection after update
          setUserId(userData.id);
          
          // Set the profile data
          setProfile(userData);
          console.log('Profile set successfully');
        } else {
          throw new Error("Invalid user data");
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError("Failed to load profile. Please make sure you are logged in.");
      }
    }

    fetchCurrentUser();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setProfile((prev) => prev ? { ...prev, [e.target.name]: e.target.value } : null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log('Selected file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      
      // Create a preview of the image
      const reader = new FileReader();
      reader.onloadend = () => {
        if (profile) {
          setProfile({
            ...profile,
            avatar: { String: reader.result as string, Valid: true }
          });
        }
      };
      reader.readAsDataURL(file);
      
      // Store the file for form submission
      const form = new FormData();
      form.append("avatar", file);
      setFormData(form);
      console.log('Avatar file prepared for upload');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    setLoading(true);
    setError(null);

    try {
      console.log('Current profile data:', profile);
      const updatedData = new FormData();
      if (profile) {
        // Handle date of birth format correctly
        const formattedDob = profile.date_of_birth ? profile.date_of_birth.substring(0, 10) : '';
        console.log('Formatted date of birth:', formattedDob);
        
        // Add all profile fields to the form data
        updatedData.append("username", profile.username);
        updatedData.append("date_of_birth", formattedDob);
        updatedData.append("gender", profile.gender || '');
        updatedData.append("first_name", profile.first_name);
        updatedData.append("last_name", profile.last_name);
        updatedData.append("email", profile.email);
        updatedData.append("profile_type", profile.profile_type);
        updatedData.append("about_me", profile.about_me || '');
        
        // Log all form data entries
        console.log('Form data entries:');
        for (const [key, value] of updatedData.entries()) {
          console.log(`${key}: ${value}`);
        }
      }
      
      // Add avatar if available
      if (formData && formData.get("avatar")) {
        const avatarFile = formData.get("avatar") as File;
        console.log('Adding avatar to form data:', avatarFile.name, 'Size:', avatarFile.size);
        updatedData.append("avatar", avatarFile);
      }

      console.log('Submitting profile update...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile`, {
        method: "PUT", // This matches the backend route defined in api.go
        body: updatedData,
        credentials: "include",
      });

      console.log('Profile update response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error updating profile:', errorText);
        throw new Error(`Failed to update profile: ${errorText}`);
      }

      router.push(`/profile/${userId}`); // Redirect to the profile page
    } catch (error) {
      setError("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (error) return <p>{error}</p>;
  if (!profile) return <p>Loading...</p>;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white">
          Edit Your Profile
        </h2>
      </div>
      
      {error && (
        <div className="rounded-md bg-red-500/20 backdrop-blur-sm p-4 mb-6">
          <div className="text-sm text-red-200">{error}</div>
        </div>
      )}
      
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-200 mb-2">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={profile.username || ''}
              onChange={handleChange}
              className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-600 bg-black/30 backdrop-blur-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your username"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-200 mb-2">
                First Name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                value={profile.first_name || ''}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-600 bg-black/30 backdrop-blur-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="First name"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-200 mb-2">
                Last Name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                value={profile.last_name || ''}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-600 bg-black/30 backdrop-blur-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-200 mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  required
                  value={profile.date_of_birth ? profile.date_of_birth.substring(0, 10) : ''}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 pl-10 border border-gray-600 bg-black/30 backdrop-blur-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  max={new Date().toISOString().split('T')[0]}
                  onFocus={(e) => e.target.showPicker()}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-200 mb-2">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                required
                value={profile.gender || ''}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-600 bg-black/30 backdrop-blur-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={profile.email || ''}
              onChange={handleChange}
              className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-600 bg-black/30 backdrop-blur-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="avatar" className="block text-sm font-medium text-gray-200 mb-2">
              Avatar
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-700">
                {profile.avatar && profile.avatar.Valid ? (
                  <img src={`http://localhost:8080/${profile.avatar.String}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  id="avatar"
                  name="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="avatar"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-200 bg-black/30 hover:bg-black/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Choose Image
                </label>
                <p className="mt-1 text-xs text-gray-400">Max file size: 5MB</p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="profile_type" className="block text-sm font-medium text-gray-200 mb-2">
              Profile Type
            </label>
            <select
              id="profile_type"
              name="profile_type"
              required
              value={profile.profile_type || 'public'}
              onChange={handleChange}
              className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-600 bg-black/30 backdrop-blur-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div>
            <label htmlFor="about_me" className="block text-sm font-medium text-gray-200 mb-2">
              About Me
            </label>
            <textarea
              id="about_me"
              name="about_me"
              value={profile.about_me || ''}
              onChange={handleChange}
              rows={4}
              className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-600 bg-black/30 backdrop-blur-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tell us about yourself"
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-200 bg-black/30 hover:bg-black/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
