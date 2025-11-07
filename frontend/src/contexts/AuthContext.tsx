import { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback } from 'react';
import api from '../api';
// jwt-decode is no longer needed, as the backend is our source of truth

interface UserProfile {
  id: string;
  email: string;
  roles: { name: string }[];
  employee: any; // The full employee record
}

interface AuthContextType {
  user: UserProfile | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roleName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage key for auth state synchronization
const AUTH_STATE_KEY = 'authState';
const AUTH_TOKEN_KEY = 'authToken';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitializingRef = useRef(false);

  // Function to update auth state in localStorage (for tab synchronization)
  const updateAuthState = (state: { token: string | null; timestamp: number }) => {
    try {
      localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to update auth state:', error);
    }
  };

  // Function to load user from token
  const loadUserFromToken = useCallback(async (token: string) => {
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.get('/users/me');
      setUser(response.data);
      updateAuthState({ token, timestamp: Date.now() });
      return true;
    } catch (error) {
      // Token is invalid or expired
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_STATE_KEY);
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      return false;
    }
  }, []);

  // This effect runs on initial app load to check for a stored token
  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    const initializeAuth = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 10000)
        );
        
        try {
          await Promise.race([loadUserFromToken(token), timeoutPromise]);
        } catch (error) {
          console.error('Auth initialization error:', error);
          // Continue anyway - user might not be logged in
        }
      }
      setLoading(false);
      isInitializingRef.current = false;
    };

    initializeAuth();
  }, []);

  // Listen for storage changes (tab synchronization)
  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      // Only handle changes to auth-related keys
      if (e.key === AUTH_STATE_KEY || e.key === AUTH_TOKEN_KEY) {
        // If auth state changed in another tab, reload auth
        const newToken = localStorage.getItem(AUTH_TOKEN_KEY);
        const authHeader = api.defaults.headers.common['Authorization'];
        const currentToken = authHeader ? authHeader.toString().replace('Bearer ', '') : null;

        if (newToken && newToken !== currentToken) {
          // Token was set in another tab - authenticate this tab
          await loadUserFromToken(newToken);
        } else if (!newToken && currentToken) {
          // Token was removed in another tab - logout this tab
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events (for same-origin synchronization)
    const handleCustomStorageChange = async (e: CustomEvent) => {
      const { token } = e.detail as { token: string | null };
      if (token) {
        await loadUserFromToken(token);
      } else {
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
      }
    };

    window.addEventListener('authStateChange', handleCustomStorageChange as unknown as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChange', handleCustomStorageChange as unknown as EventListener);
    };
  }, [loadUserFromToken]);

  const login = async (token: string) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    await loadUserFromToken(token);
    
    // Dispatch custom event for same-tab synchronization (if needed)
    window.dispatchEvent(
      new CustomEvent('authStateChange', { detail: { token } })
    );
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_STATE_KEY);
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    
    // Dispatch custom event for same-tab synchronization
    window.dispatchEvent(
      new CustomEvent('authStateChange', { detail: { token: null } })
    );
  };

  const isAuthenticated = !!user;

  const hasRole = (roleName: string): boolean => {
    return user?.roles?.some(role => role.name === roleName) ?? false;
  };

  // Show a loading state for the whole app while we verify the token
  if (loading) {
      return <div>Loading Application...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}