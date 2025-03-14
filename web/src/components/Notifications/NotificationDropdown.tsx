'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { BellIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, setNotifications, setUnreadCount } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Calculate position ensuring it stays within viewport
      const viewportWidth = window.innerWidth;
      // Center the dropdown on the button, but ensure it stays within viewport
      const idealLeft = rect.left + window.scrollX - 160 + rect.width / 2;
      const leftPosition = Math.max(10, Math.min(idealLeft, viewportWidth - 330));
      
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 5,
        left: leftPosition
      });
    }
  }, [isOpen]);

  const handleNotificationClick = async (notificationId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleFollowAction = async (notification: any, status: 'accepted' | 'declined', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const formData = new FormData();
      formData.append('status', status);
      
      const response = await fetch(`/api/follow/${notification.link_id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to update follow status');
      
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

  const handleGroupInvitationAction = async (notification: any, status: 'accepted' | 'declined', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const formData = new FormData();
      formData.append('status', status);
      
      const response = await fetch(`/api/groups/${notification.link_id}/respond-invite`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to respond to group invitation');
      
      // Find and delete the group invitation notification

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
      console.error('Error responding to group invitation:', error);
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
      case 'group_invitation':
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
      case 'group_invitation':
        return `/groups/${linkId}`;
      default:
        return '#';
    }
  };

  // Render dropdown using portal
  const renderDropdown = () => {
    if (!isOpen) return null;
    
    return createPortal(
      <div 
        ref={dropdownRef}
        className="fixed w-[320px] bg-[#0f1729] rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10" 
        style={{ 
          top: `${dropdownPosition.top}px`, 
          left: `${dropdownPosition.left}px`,
          maxWidth: 'calc(100vw - 20px)',
          zIndex: 9999
        }}
      >
        <div className="p-4 flex justify-between items-center border-b border-[#1e293b]">
          <h3 className="text-white font-medium text-lg">
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
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#1e293b] flex items-center justify-center text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-white text-sm font-medium">{notification.text}</p>
                      {notification.type === 'follow request' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={(e) => handleFollowAction(notification, 'accepted', e)}
                            className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-200"
                          >
                            Accept
                          </button>
                          <button
                            onClick={(e) => handleFollowAction(notification, 'declined', e)}
                            className="px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {notification.type === 'group_invitation' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={(e) => handleGroupInvitationAction(notification, 'accepted', e)}
                            className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-200"
                          >
                            Accept
                          </button>
                          <button
                            onClick={(e) => handleGroupInvitationAction(notification, 'declined', e)}
                            className="px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      <p className="text-gray-400 text-xs">
                        {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.seen && (
                      <span className="h-3 w-3 rounded-full bg-blue-500 flex-shrink-0 mt-2"></span>
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
      </div>,
      document.body
    );
  };

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full p-3 text-white hover:bg-white/10 rounded-lg transition-all duration-200 flex items-center justify-center group"
      >
        <BellIcon className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {isMounted && renderDropdown()}
    </div>
  );
}
