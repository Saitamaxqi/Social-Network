'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username?: string | null;
  age?: number | null;
  gender?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  type?: string | null;
  requested?: boolean | null;
  avatar?: { String: string; Valid: boolean };
  profile_type?: string | null;
  about_me?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export let Currentuser = null;
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      console.log('Checking authentication...');
      const response = await fetch('../api/auth/check-session', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Auth check successful:', data);
        setUser(data); // The backend sends the user directly
        Currentuser = data;
      } else {
        console.log('Auth check failed:', await response.text());
        setUser(null);
        Currentuser = null;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      Currentuser = null;
    } finally {
      setLoading(false);
    }
  };

  // Check auth status when the component mounts
  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const formData = new FormData();
      formData.append('identifier', identifier);
      formData.append('password', password);

      const response = await fetch('../api/auth/login', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setUser(data);
      Currentuser = data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Logout failed');
      }

      // Clear the user state
      setUser(null);
      Currentuser = null;

      // Force reload to clear all state
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on the server, clear local state
      setUser(null);
      Currentuser = null;
      window.location.href = '/auth/login';
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
