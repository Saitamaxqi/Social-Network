'use client';

import MainLayout from '@/components/Layout/MainLayout';
import Post from '@/components/Post/Post';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function PostsPage() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('category');
  const scrollToPostId = searchParams.get('scrollTo');
  
  useEffect(() => {
    if (scrollToPostId) {
      // Wait for posts to load
      setTimeout(() => {
        const postElement = document.getElementById(`post-${scrollToPostId}`);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a highlight effect
          postElement.classList.add('highlight-post');
          setTimeout(() => {
            postElement.classList.remove('highlight-post');
          }, 2000);
        }
      }, 500);
    }
  }, [scrollToPostId]);
  
  return (
    <MainLayout>
      <Post scrollToPostId={scrollToPostId} />
    </MainLayout>
  );
}
