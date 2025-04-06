'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RegisterForm from '@/components/Auth/RegisterForm';
import MainLayout from '@/components/Layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is logged in and not loading, redirect to home page
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  // If still loading or already redirecting, show loading spinner
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <MainLayout>
      <RegisterForm />
    </MainLayout>
  );
}
