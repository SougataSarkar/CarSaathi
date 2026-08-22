import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface ThemeContextType {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.id) {
          const userTheme = localStorage.getItem(`theme_user_${parsed.id}`);
          if (userTheme === 'dark' || userTheme === 'light') {
            return userTheme;
          }
        }
      } catch {}
    }
    const globalTheme = localStorage.getItem('theme');
    if (globalTheme === 'dark' || globalTheme === 'light') {
      return globalTheme;
    }
    return 'light'; // Default to light mode
  });

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.body.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
    if (user && user.id) {
      localStorage.setItem(`theme_user_${user.id}`, theme);
    }
  }, [theme, user]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
