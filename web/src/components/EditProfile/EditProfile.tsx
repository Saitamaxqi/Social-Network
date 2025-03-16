//not working yet


import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, ChangeEvent, FormEvent } from "react";

interface Profile {
  id: number;
  username: string;
  age: number;
  gender: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_type: string;
  about_me?: string;
  avatar: { String: string; Valid: boolean };
}

export function EditProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/${id}`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch profile");

        const data = await response.json();
        if (data.user) {
          setProfile(data.user);
        } else {
          throw new Error("Invalid API response");
        }
      } catch (err) {
        setError("This account is private");
        console.error(err);
      }
    }

    if (id) fetchProfile();
  }, [id]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile((prev) => prev ? { ...prev, [e.target.name]: e.target.value } : null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const form = new FormData();
      form.append("avatar", e.target.files[0]);
      setFormData(form);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedData = new FormData();
      if (profile) {
        Object.entries(profile).forEach(([key, value]) => {
          if (value) updatedData.append(key, value.toString());
        });
      }
      if (formData) updatedData.append("avatar", formData.get("avatar") as File);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/update`, {
        method: "POST",
        body: updatedData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to update profile");

      router.push(`/profile/${id}`); // Redirect to the profile page
    } catch (error) {
      setError("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (error) return <p>{error}</p>;
  if (!profile) return <p>Loading...</p>;

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="first_name" value={profile.first_name} onChange={handleChange} className="border p-2 w-full" placeholder="First Name" required />
        <input type="text" name="last_name" value={profile.last_name} onChange={handleChange} className="border p-2 w-full" placeholder="Last Name" required />
        <input type="text" name="username" value={profile.username} onChange={handleChange} className="border p-2 w-full" placeholder="Username" required />
        <input type="number" name="age" value={profile.age} onChange={handleChange} className="border p-2 w-full" placeholder="Age" required />
        <input type="email" name="email" value={profile.email} onChange={handleChange} className="border p-2 w-full" placeholder="Email" required />
        <input type="text" name="profile_type" value={profile.profile_type} onChange={handleChange} className="border p-2 w-full" placeholder="Profile Type" required />
        <textarea name="about_me" value={profile.about_me} onChange={handleChange} className="border p-2 w-full" placeholder="About Me" />
        
        <input type="file" name="avatar" onChange={handleFileChange} className="border p-2 w-full" />
        
        <button type="submit" disabled={loading} className="bg-blue-500 text-white p-2 rounded w-full">
          {loading ? "Updating..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
