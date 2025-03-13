'use client';

import { useSearchParams } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import CreateGroupPost from '@/components/GroupPost/CreateGroupPost';
import GroupPost from '@/components/GroupPost/GroupPost';

export default function GroupPostsPage({ params }: { params: { groupId: string } }) {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('category') || undefined;
  const { groupId } = params;

  return (
    <MainLayout>
      <div className="space-y-8">
        <CreateGroupPost />
        <GroupPost groupId={groupId} categoryId={categoryId} />
      </div>
    </MainLayout>
  );
}
