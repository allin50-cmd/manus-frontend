import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const THEME_STORAGE_KEY = 'clerkos-theme';
const THEME_DEFAULT_VERSION_KEY = 'clerkos-theme-default-version';
const LIGHT_DEFAULT_VERSION = '2026-05-light-default';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark';
}

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
    if (typeof window === 'undefined') return defaultTheme;

    const storedDefaultVersion = localStorage.getItem(THEME_DEFAULT_VERSION_KEY);
    if (storedDefaultVersion !== LIGHT_DEFAULT_VERSION) {
      localStorage.setItem(THEME_DEFAULT_VERSION_KEY, LIGHT_DEFAULT_VERSION);
      localStorage.setItem(THEME_STORAGE_KEY, defaultTheme);
      return defaultTheme;
    }

    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.setItem(THEME_DEFAULT_VERSION_KEY, LIGHT_DEFAULT_VERSION);
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
