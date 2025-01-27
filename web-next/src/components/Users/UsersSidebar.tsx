'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
}

export default function UsersSidebar() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="w-64 h-screen bg-black/10 backdrop-blur-sm p-4 fixed right-0 top-0">
      <h2 className="text-xl font-semibold mb-4 text-white text-center">Soul Reapers</h2>
      <div className="flex flex-col gap-4">
        {users.map((user) => (
          <Link
            key={user.id}
            href={`/profile/${user.id}`}
            className="w-full px-4 py-2 text-white bg-black/30 hover:bg-black/50 rounded-lg transition-colors duration-200 text-center"
          >
            {user.username}
          </Link>
        ))}
      </div>
    </div>
  );
}
