import React, { createContext, useContext, useState } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  showAuthModal: boolean;
  showCallbackModal: boolean;
  authMode: 'login' | 'register';
  showUserDropdown: boolean;
  setShowAuthModal: (open: boolean) => void;
  setShowCallbackModal: (open: boolean) => void;
  setShowUserDropdown: (open: boolean) => void;
  setAuthMode: (mode: 'login' | 'register') => void;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setShowUserDropdown(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        showAuthModal,
        showCallbackModal,
        authMode,
        showUserDropdown,
        setShowAuthModal,
        setShowCallbackModal,
        setShowUserDropdown,
        setAuthMode,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
