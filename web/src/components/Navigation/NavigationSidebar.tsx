'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import NotificationDropdown from '../Notifications/NotificationDropdown';

export default function NavigationSidebar() {
  const { user, loading } = useAuth();

  type BaseRoute = {
    label: string;
  };

  type NavigableRoute = BaseRoute & {
    path: string;
    requiresAuth?: boolean;
  };

  const routes: NavigableRoute[] = [
    { path: '/', label: 'Home', requiresAuth: false },
    { path: '/posts', label: 'Posts', requiresAuth: false },
    { path: '/posts/create', label: 'Create Post', requiresAuth: true },
    { path: '/groups', label: 'Groups', requiresAuth: true },
    { path: '/profile', label: 'Profile', requiresAuth: true },
    { path: '/auth/logout', label: 'Logout', requiresAuth: true },
  ];

  const authRoutes: NavigableRoute[] = user
    ? []
    : [
        { path: '/auth/login', label: 'Login' },
        { path: '/auth/register', label: 'Register' },
      ];

  if (loading) {
    return (
      <div className="w-64 md:w-64 h-screen bg-black/10 backdrop-blur-sm flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="w-64 md:w-64 h-screen bg-black/10 backdrop-blur-sm flex flex-col overflow-hidden">
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* User info section when logged in */}
          {user && (
            <div className="mb-6">
              <div className="text-center">
                <div className="text-lg font-semibold text-white mb-2">
                  Welcome back
                </div>
                <div className="text-sm text-gray-300">
                  {user.email || user.username}
                </div>
              </div>
              {/* Notifications */}
              <div className="mt-4 flex justify-center">
                <NotificationDropdown />
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-2">
            {routes.map((route) => {
              if (route.requiresAuth && !user) return null;
              
              // Special handling for Create Post link
              if (route.label === 'Create Post' && user) {
                return (
                  <Link
                    key={route.path}
                    href="/posts/create"
                    className="block px-4 py-2 text-gray-200 hover:bg-black/20 rounded transition-colors bg-blue-600/30"
                  >
                    + {route.label}
                  </Link>
                );
              }
              
              return (
                <Link
                  key={route.path}
                  href={route.path}
                  className="block px-4 py-2 text-gray-200 hover:bg-black/20 rounded transition-colors"
                >
                  {route.label}
                </Link>
              );
            })}
            {authRoutes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                className="block px-4 py-2 text-gray-200 hover:bg-black/20 rounded transition-colors"
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}