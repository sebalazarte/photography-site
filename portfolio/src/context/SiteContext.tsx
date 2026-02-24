import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchSiteProfile, type SiteProfile } from '../api/site';

export type SiteContextState = {
  site: SiteProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const SiteContext = createContext<SiteContextState | undefined>(undefined);

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [site, setSite] = useState<SiteProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSite = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSiteProfile();
      setSite(result);
    } catch (err) {
      console.error('No se pudo cargar la información del sitio', err);
      setSite(null);
      setError(err instanceof Error ? err.message : 'No se pudo cargar los datos del sitio');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSite();
  }, [loadSite]);

  const value = useMemo<SiteContextState>(
    () => ({ site, loading, error, refresh: loadSite }),
    [site, loading, error, loadSite]
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
};

export const useSite = () => {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used within SiteProvider');
  }
  return context;
};
