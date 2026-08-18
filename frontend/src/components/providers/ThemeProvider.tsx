'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'amoled' | 'ocean' | 'mocha' | 'sublime' | 'nord';

export const THEMES: { id: Theme; label: string; description: string; accentColor: string }[] = [
  { id: 'dark',          label: 'Dark',          description: 'Default dark theme',          accentColor: '#6c63ff' },
  { id: 'light',         label: 'Light',         description: 'Clean light mode',            accentColor: '#6c63ff' },
  { id: 'amoled',        label: 'AMOLED',        description: 'Pure black for OLED screens', accentColor: '#6c63ff' },
  { id: 'ocean',         label: 'Ocean Breeze',  description: 'Soft & relaxing blues',       accentColor: '#0284c7' },
  { id: 'mocha',         label: 'Mocha',         description: 'Warm & earthy dark tones',    accentColor: '#cba6f7' },
  { id: 'sublime',       label: 'Sublime Text',  description: 'Warm dark with gold accent',  accentColor: '#e6b450' },
  { id: 'nord',          label: 'Nord',          description: 'Arctic, bluish palette',      accentColor: '#88c0d0' },
];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'ocean',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('ocean');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && THEMES.some(t => t.id === savedTheme)) {
      applyTheme(savedTheme);
      setThemeState(savedTheme);
    } else {
      applyTheme('ocean');
    }
  }, []);

  const applyTheme = (t: Theme) => {
    document.documentElement.className = `theme-${t}`;
    document.documentElement.setAttribute('data-theme', t);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
