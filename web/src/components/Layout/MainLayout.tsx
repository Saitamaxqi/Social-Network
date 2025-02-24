'use client';

import NavigationSidebar from '@/components/Navigation/NavigationSidebar';
import UsersSidebar from '@/components/Users/UsersSidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[url('/images/soul-society-bg.jpg')] bg-cover bg-center">
      <div className="min-h-screen bg-black/40 backdrop-blur-sm flex">
        {/* Left Sidebar - Navigation */}
        <NavigationSidebar />

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 w-full max-w-4xl min-h-[500px] shadow-xl">
            {children}
          </div>
        </main>

        {/* Right Sidebar - Users */}
        <UsersSidebar />
      </div>
    </div>
  );
}
