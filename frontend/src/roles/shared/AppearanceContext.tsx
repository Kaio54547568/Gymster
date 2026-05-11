import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';

type AppearanceContextValue = {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('gymster-dark-mode') !== 'off';
  });

  const setStoredDarkMode = (value: boolean) => {
    setDarkMode(value);
    window.localStorage.setItem('gymster-dark-mode', value ? 'on' : 'off');
  };

  const value = useMemo(() => ({ darkMode, setDarkMode: setStoredDarkMode }), [darkMode]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error('useAppearance must be used inside AppearanceProvider');
  return value;
}
