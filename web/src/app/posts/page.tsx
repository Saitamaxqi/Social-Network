'use client';

import MainLayout from '@/components/Layout/MainLayout';
import Post from '@/components/Post/Post';
import { useSearchParams } from 'next/navigation';

export default function PostsPage() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('category');

  return (
    <MainLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-white text-center">Posts</h2>
        <Post categoryId={categoryId || undefined} />
      </div>
    </MainLayout>
  );
}
