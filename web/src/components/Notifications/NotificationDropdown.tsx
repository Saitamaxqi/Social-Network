'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { BellIcon } from '@heroicons/react/24/outline';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, setNotifications, setUnreadCount } = useNotifications();
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

  const handleNotificationClick = async (notificationId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleFollowAction = async (followId: number, status: 'accepted' | 'declined', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const formData = new FormData();
      formData.append('status', status);
      
      const response = await fetch(`/api/follow/${followId}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to update follow status');
      
      // Find and delete the follow request notification
      const notification = notifications.find(n => n.type === 'follow request' && n.link_id === followId);
      if (notification) {
        // Delete notification from database
        const deleteResponse = await fetch(`/api/notifications/${notification.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!deleteResponse.ok) {
          throw new Error('Failed to delete notification');
        }

        // Update notifications in context to remove this one
        const updatedNotifications = notifications.filter(n => n.id !== notification.id);
        setNotifications(updatedNotifications);
        if (unreadCount > 0) setUnreadCount(unreadCount - 1);
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'post':
        return '📝';
      case 'message':
        return '💬';
      case 'follow':
      case 'follow request':
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
        <div className="absolute left-0 mt-2 w-[300px] bg-[#0f1729] rounded-[8px] shadow-2xl overflow-hidden z-50 ring-1 ring-white/10">
          <div className="p-3 flex justify-between items-center border-b border-[#1e293b]">
            <h3 className="text-white font-medium">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-gray-400 text-center">
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1e293b]">
                {(showAll ? notifications : notifications.slice(0, 5)).map((notification) => (
                  <Link
                    key={notification.id}
                    href={getNotificationLink(notification.type, notification.link_id)}
                    onClick={() => handleNotificationClick(notification.id)}
                    className={`block px-4 py-3 hover:bg-[#1e293b] transition-colors duration-200 ${!notification.seen ? 'bg-[#1e293b]/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-[4px] bg-[#1e293b] flex items-center justify-center text-gray-300">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-white text-sm">{notification.text}</p>
                        {notification.type === 'follow request' && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={(e) => handleFollowAction(notification.link_id, 'accepted', e)}
                              className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors duration-200"
                            >
                              Accept
                            </button>
                            <button
                              onClick={(e) => handleFollowAction(notification.link_id, 'declined', e)}
                              className="px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors duration-200"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                        <p className="text-gray-400 text-sm">
                          {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.seen && (
                        <span className="h-2 w-2 rounded-full bg-blue-400 flex-shrink-0 mt-2"></span>
                      )}
                    </div>
                  </Link>
                ))}
                {!showAll && notifications.length > 5 && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="w-full p-3 text-center text-sm font-medium text-gray-300 hover:bg-[#1e293b] transition-colors duration-200"
                  >
                    Show all
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
