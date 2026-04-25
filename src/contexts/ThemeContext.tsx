import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  switchable = true,
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('clerkos-theme') : null;
    return (stored as Theme | null) ?? defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('clerkos-theme', theme);
  }, [theme]);

  const setTheme = (t: Theme) => {
    if (switchable) setThemeState(t);
  };

  const toggleTheme = () => {
    if (switchable) setThemeState((t) => (t === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
