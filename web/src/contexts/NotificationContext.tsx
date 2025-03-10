'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';

interface Notification {
  id: number;
  user_id: number;
  text: string;
  seen: boolean;
  sender_id: number;
  type: string;
  link_id: number;
  date: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { socket } = useWebSocket();

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setNotifications(data);
        setError(null);
      } else {
        setNotifications([]);
        throw new Error('Invalid notifications data format');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch notifications');
      setNotifications([]);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      setNotifications(prev =>
        (prev || []).map(notif =>
          notif.id === notificationId ? { ...notif, seen: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      setNotifications(prev =>
        (prev || []).map(notif => ({ ...notif, seen: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      const handleMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification' && data.notification) {
            // Ensure the notification object has the expected structure
            const notification = data.notification;
            
            // Convert backend notification format to frontend format if needed
            const formattedNotification: Notification = {
              id: notification.ID || notification.id || 0,
              user_id: notification.UserID || notification.user_id || 0,
              text: notification.Text || notification.text || '',
              seen: notification.Seen || notification.seen || false,
              sender_id: notification.SenderID || notification.sender_id || 0,
              type: notification.Type || notification.type || '',
              link_id: notification.LinkID || notification.link_id || 0,
              date: notification.Date || notification.date || new Date().toISOString(),
            };
            
            setNotifications(prev => [formattedNotification, ...(prev || [])]);
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      };

      socket.addEventListener('message', handleMessage);

      return () => {
        socket.removeEventListener('message', handleMessage);
      };
    }
  }, [socket]);

  const unreadCount = (notifications || []).filter(n => !n.seen).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      setNotifications,
      setUnreadCount: (count) => setNotifications(prev => {
        // Update unread count by recalculating from notifications
        const newUnread = typeof count === 'function' ? count(prev.filter(n => !n.seen).length) : count;
        return prev.map((n, i) => ({
          ...n,
          seen: i >= newUnread // Mark notifications as seen based on new unread count
        }));
      })
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
