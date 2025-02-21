"use client";

import { useParams } from "next/navigation";

export default function ProfilePage() {
  const { id } = useParams(); // Extract the ID from URL

  if (!id) return <p>Profile ID not found</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold">Profile ID: {id}</h1>
      <p>Welcome to the profile page of user {id}!</p>
    </div>
  );
}
