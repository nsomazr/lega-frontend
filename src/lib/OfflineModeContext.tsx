'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'melt_online_mode';

type OfflineModeContextType = {
  /** When false (default), platform is offline-first: no TanzLii, web search, or other online services. */
  isOnline: boolean;
  setOnlineMode: (online: boolean) => void;
};

const OfflineModeContext = createContext<OfflineModeContextType>({
  isOnline: false,
  setOnlineMode: () => {},
});

export function OfflineModeProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnlineState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return false; // offline first
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, String(isOnline));
  }, [isOnline]);

  const setOnlineMode = useCallback((online: boolean) => {
    setIsOnlineState(online);
  }, []);

  return (
    <OfflineModeContext.Provider value={{ isOnline, setOnlineMode }}>
      {children}
    </OfflineModeContext.Provider>
  );
}

export function useOfflineMode() {
  const ctx = useContext(OfflineModeContext);
  return ctx ?? { isOnline: false, setOnlineMode: () => {} };
}
