'use client';

import { useState } from 'react';
import NavigationSidebar from '@/components/Navigation/NavigationSidebar';
import UsersSidebar from '@/components/Users/UsersSidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [usersSidebarOpen, setUsersSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[url('/images/soul-society-bg.jpg')] bg-cover bg-center bg-fixed">
      <div className="min-h-screen bg-black/40 backdrop-blur-sm flex flex-col md:flex-row relative">
        {/* Mobile Menu Button - only visible on small screens */}
        <div className="fixed top-4 left-4 z-50 md:hidden">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Friends/Users Menu Button - only visible on small screens */}
        <div className="fixed top-4 right-4 z-50 md:hidden">
          <button 
            onClick={() => setUsersSidebarOpen(!usersSidebarOpen)}
            className={`p-2 rounded-full ${usersSidebarOpen ? 'bg-blue-600' : 'bg-black/50'} text-white hover:bg-blue-700 transition-colors`}
            aria-label="Toggle friends list"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>

        {/* Left Sidebar - Navigation */}
        <div className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out fixed md:relative z-40 md:z-auto`}>
          <NavigationSidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 flex items-start justify-center p-4 md:p-8 overflow-y-auto mt-14 md:mt-0 min-h-screen">
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 md:p-8 w-full max-w-4xl shadow-xl">
            {children}
          </div>
        </main>

        {/* Right Sidebar - Users */}
        <div className={`${usersSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out fixed md:relative z-40 md:z-auto right-0 top-0`}>
          <UsersSidebar />
        </div>

        {/* Overlay for mobile when sidebar is open */}
        {(mobileMenuOpen || usersSidebarOpen) && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => {
              setMobileMenuOpen(false);
              setUsersSidebarOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
