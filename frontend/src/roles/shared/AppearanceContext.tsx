import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getCurrentUser, setCurrentUser } from '../../services/authService';
import { getCurrentUserSettings, updateCurrentUserSettings } from '../../services/userProfileApi';

export type ThemeMode = 'dark' | 'light';

type AppearanceContextValue = {
  theme: ThemeMode;
  setTheme: (value: ThemeMode) => void;
  toggleTheme: () => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
};

const THEME_STORAGE_KEY = 'gymster-theme';
const LEGACY_DARK_MODE_KEY = 'gymster-dark-mode';
const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'dark' || value === 'light';
}

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';

  const currentUser = getCurrentUser();
  const userTheme = currentUser?.theme || currentUser?.displayTheme || currentUser?.display_theme;
  if (isThemeMode(userTheme)) return userTheme;

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (isThemeMode(storedTheme)) return storedTheme;

  const legacyDarkMode = window.localStorage.getItem(LEGACY_DARK_MODE_KEY);
  if (legacyDarkMode === 'off') return 'light';
  if (legacyDarkMode === 'on') return 'dark';

  return getSystemTheme();
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme === 'light');
  root.classList.toggle('gymster-dark', theme === 'dark');
  root.classList.toggle('gymster-light', theme === 'light');
}

export function initializeTheme() {
  applyTheme(getInitialTheme());
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => getInitialTheme());
  const hasLoadedRemoteSettings = useRef(false);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    window.localStorage.setItem(LEGACY_DARK_MODE_KEY, theme === 'dark' ? 'on' : 'off');

    const currentUser = getCurrentUser();
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        theme,
        displayTheme: theme,
        display_theme: theme,
      });
    }

    if (hasLoadedRemoteSettings.current) {
      void updateCurrentUserSettings(currentUser, { theme });
    }
  }, [theme]);

  useEffect(() => {
    let isMounted = true;
    const currentUser = getCurrentUser();
    const settingsUser = currentUser ? { ...currentUser, theme } : { theme };

    getCurrentUserSettings(settingsUser)
      .then(({ data }) => {
        if (!isMounted) return;
        const remoteTheme = data?.theme;
        if (isThemeMode(remoteTheme)) {
          setThemeState(remoteTheme);
          if (currentUser) {
            setCurrentUser({
              ...currentUser,
              theme: remoteTheme,
              displayTheme: remoteTheme,
              display_theme: remoteTheme,
            });
          }
        }
      })
      .finally(() => {
        hasLoadedRemoteSettings.current = true;
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const syncTheme = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY || !isThemeMode(event.newValue)) return;
      setThemeState(event.newValue);
    };

    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  const value = useMemo<AppearanceContextValue>(() => {
    const setTheme = (nextTheme: ThemeMode) => setThemeState(nextTheme);
    const setDarkMode = (value: boolean) => setThemeState(value ? 'dark' : 'light');

    return {
      theme,
      setTheme,
      toggleTheme: () => setThemeState((current) => (current === 'dark' ? 'light' : 'dark')),
      darkMode: theme === 'dark',
      setDarkMode,
    };
  }, [theme]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error('useAppearance must be used inside AppearanceProvider');
  return value;
}
