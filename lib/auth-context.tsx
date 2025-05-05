'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Use NEXT_PUBLIC_API_URL
const API_URL = process.env.NEXT_PUBLIC_API_URL;
type User = {
  username: string;
  // Add other user fields if needed
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const username = localStorage.getItem('username');
    const currentlyAuthenticated = !!accessToken && !!refreshToken;

    if (currentlyAuthenticated) {
      setIsAuthenticated(true);
      if (username) {
        setUser({ username });
      }
      if (pathname === '/login' || pathname === '/register') {
        router.push('/');
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
      const publicPaths = ['/', '/login', '/register'];
      if (!publicPaths.includes(pathname)) {
        router.push('/login');
      }
    }
    setIsLoading(false);
  }, [pathname, router]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      // Use the API_URL constant derived from NEXT_PUBLIC_API_URL
      const response = await fetch(`${API_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      localStorage.setItem('username', username);
      
      setUser({ username });
      setIsAuthenticated(true);
      
      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Use the API_URL constant derived from NEXT_PUBLIC_API_URL
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data = await response.json();
      
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      localStorage.setItem('username', username);
      
      setUser({ username });
      setIsAuthenticated(true);
      
      router.push('/');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    setUser(null);
    setIsAuthenticated(false);
    router.push('/');
  };

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const accessToken = localStorage.getItem('accessToken');
    
    const headers = {
      ...(options.headers || {}),
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
    };
    
    let response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
      try {
        const refreshed = await refreshToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
          response = await fetch(url, { ...options, headers });
        } else {
          logout();
          throw new Error('Session expired. Please log in again.');
        }
      } catch (error) {
        console.error('Token refresh error during fetch:', error);
        logout();
        throw error;
      }
    }
    
    return response;
  };

  const refreshToken = async (): Promise<boolean> => {
    const currentRefreshToken = localStorage.getItem('refreshToken');
    if (!currentRefreshToken) return false;
    
    try {
      // Use the API_URL constant derived from NEXT_PUBLIC_API_URL
      const response = await fetch(`${API_URL}/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: currentRefreshToken }),
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      const data = await response.json();
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    fetchWithAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? null : children}
    </AuthContext.Provider>
  );
};