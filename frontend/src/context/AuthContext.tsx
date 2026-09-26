import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchDemoUser: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('stocksense_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('stocksense_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('stocksense_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.data?.user) {
            setUser(res.data.data.user);
            localStorage.setItem('stocksense_user', JSON.stringify(res.data.data.user));
          }
        } catch (err) {
          console.warn('Failed to verify existing session:', err);
          logout();
        }
      } else {
        // Auto demo login if no session exists so reviewers can instantly use the platform
        await switchDemoUser('INVENTORY_MANAGER');
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: loggedInUser, token: authToken } = res.data.data;
    setUser(loggedInUser);
    setToken(authToken);
    localStorage.setItem('stocksense_token', authToken);
    localStorage.setItem('stocksense_user', JSON.stringify(loggedInUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('stocksense_token');
    localStorage.removeItem('stocksense_user');
  };

  const switchDemoUser = async (role: UserRole) => {
    setIsLoading(true);
    try {
      let email = 'manager@stocksense.io';
      let pass = 'manager123';
      if (role === 'ADMIN') {
        email = 'admin@stocksense.io';
        pass = 'admin123';
      } else if (role === 'WAREHOUSE_STAFF') {
        email = 'staff@stocksense.io';
        pass = 'staff123';
      }

      await login(email, pass);
    } catch (err) {
      console.error('Demo auto-login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
