'use client';

import MainLayout from '@/components/Layout/MainLayout';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <MainLayout>
      <h1 className="text-5xl font-bold text-white text-center font-japanese">
        Yokoso watashi no soul society
      </h1>
    </MainLayout>
  );
}
