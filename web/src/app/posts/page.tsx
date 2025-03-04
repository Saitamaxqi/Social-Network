'use client';

import MainLayout from '@/components/Layout/MainLayout';
import Post from '@/components/Post/Post';
import { useSearchParams } from 'next/navigation';

export default function PostsPage() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('category');
  
  return (
    <MainLayout>
      <Post 
        categoryId={categoryId || undefined}
      />
    </MainLayout>
  );
}
