'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function AuthDebug() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="text-xs p-2 bg-yellow-100 rounded">Loading auth state...</div>;
  }
  
  return (
    <div className="text-xs p-2 bg-gray-100 rounded mb-4">
      <h4 className="font-bold">Auth Debug</h4>
      <p>User authenticated: {user ? 'Yes' : 'No'}</p>
      {user && (
        <>
          <p>User ID: {user.id}</p>
          <p>Username: {user.username || 'N/A'}</p>
          <p>Email: {user.email || 'N/A'}</p>
        </>
      )}
    </div>
  );
}
