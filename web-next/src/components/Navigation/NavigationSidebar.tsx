'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function NavigationSidebar() {
  const { data: session } = useSession();

  const routes = [
    { path: '/posts', label: 'Posts', requiresAuth: true },
    { path: '/profile', label: 'Profile', requiresAuth: true },
    { path: '/login', label: 'Login', requiresAuth: false },
    { path: '/register', label: 'Register', requiresAuth: false },
  ];

  return (
    <div className="w-64 h-screen bg-black/10 backdrop-blur-sm p-4 fixed left-0 top-0">
      <div className="flex flex-col gap-4">
        {routes.map((route) => {
          // Only show auth routes when logged in and non-auth routes when logged out
          if ((route.requiresAuth && session) || (!route.requiresAuth && !session)) {
            return (
              <Link
                key={route.path}
                href={route.path}
                className="w-full px-4 py-2 text-white bg-black/30 hover:bg-black/50 rounded-lg transition-colors duration-200 text-center"
              >
                {route.label}
              </Link>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
