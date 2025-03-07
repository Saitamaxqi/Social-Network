'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  socket: WebSocket | null;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Create WebSocket connection
      const ws = new WebSocket('ws://localhost:8080/ws');

      ws.onopen = () => {
        console.log('WebSocket Connected');
      };

      ws.onclose = () => {
        console.log('WebSocket Disconnected');
        // Try to reconnect after 5 seconds
        setTimeout(() => {
          setSocket(null);
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
      };

      setSocket(ws);

      // Cleanup on unmount
      return () => {
        ws.close();
      };
    } else {
      // Close socket if user logs out
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [user]);

  // Send heartbeat every 30 seconds to keep connection alive
  useEffect(() => {
    if (socket) {
      const interval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [socket]);

  return (
    <WebSocketContext.Provider value={{ socket }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
