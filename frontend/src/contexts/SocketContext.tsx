import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../api';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Get the API base URL
    const apiUrl = api.defaults.baseURL || 'http://localhost:3000';
    
    // Create Socket.IO connection with authentication - non-blocking
    const token = localStorage.getItem('authToken');
    if (!token) {
      return;
    }

    // Use requestIdleCallback or setTimeout to defer connection and not block rendering
    const connectSocket = () => {
      const newSocket = io(apiUrl, {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 5000, // Connection timeout
        forceNew: false, // Reuse existing connection if available
        autoConnect: true,
      });

      newSocket.on('connect', () => {
        console.log('Socket.IO connected');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket.IO disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error: Error) => {
        console.error('Socket.IO connection error:', error);
        setIsConnected(false);
        // Don't block on connection errors - app should still work
      });

      setSocket(newSocket);
    };

    // Defer connection to not block initial render
    // Use requestIdleCallback if available, otherwise setTimeout
    let connectionTimeout: ReturnType<typeof setTimeout>;
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleCallback = (window as any).requestIdleCallback || setTimeout;
      connectionTimeout = idleCallback(connectSocket, { timeout: 500 });
    } else {
      connectionTimeout = setTimeout(connectSocket, 500); // Delay to allow app to render first
    }

    return () => {
      clearTimeout(connectionTimeout);
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

