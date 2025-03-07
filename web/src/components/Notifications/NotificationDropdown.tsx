'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { BellIcon } from '@heroicons/react/24/outline';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notificationId: number) => {
    await markAsRead(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'post':
        return '📝';
      case 'message':
        return '💬';
      case 'follow':
        return '👥';
      default:
        return '🔔';
    }
  };

  const getNotificationLink = (type: string, linkId: number) => {
    switch (type) {
      case 'post':
        return `/posts/${linkId}`;
      case 'message':
        return `/chats?userId=${linkId}`;
      case 'follow':
        return `/profile/${linkId}`;
      default:
        return '#';
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full p-3 text-white hover:bg-white/10 rounded-lg transition-all duration-200 flex items-center justify-center group"
      >
        <BellIcon className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-[280px] bg-gray-900 rounded-lg shadow-2xl overflow-hidden z-50 ring-1 ring-white/10 backdrop-blur-sm">
          <div className="p-4 bg-gray-800/50 border-b border-gray-700/50 flex justify-between items-center sticky top-0">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <BellIcon className="h-5 w-5 text-blue-400" />
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200 px-2 py-1 rounded hover:bg-blue-500/10"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
            {notifications.length === 0 ? (
              <div className="p-8 text-gray-400 text-center flex flex-col items-center gap-3">
                <BellIcon className="h-8 w-8 text-gray-600" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700/50">
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={getNotificationLink(notification.type, notification.link_id)}
                    onClick={() => handleNotificationClick(notification.id)}
                    className={`block px-4 py-3 hover:bg-white/5 transition-colors duration-200 ${!notification.seen ? 'bg-white/5' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0" role="img" aria-label={notification.type}>
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-100 text-sm font-medium leading-snug">{notification.text}</p>
                        <p className="text-gray-400 text-xs mt-1.5 flex items-center gap-1.5">
                          <span className="inline-block h-1 w-1 rounded-full bg-gray-500"></span>
                          {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.seen && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-2"></span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
