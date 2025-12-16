import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchPrimaryContactProfile, type ContactProfile } from '../api/users';
import { setParseContentOwner } from '../api/client';
import { useAuth } from './AuthContext';

type ContactProfileState = {
  profile: ContactProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const ContactProfileContext = createContext<ContactProfileState | undefined>(undefined);

export const ContactProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<ContactProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPrimaryContactProfile();
      setProfile(result);
    } catch (err) {
      console.error('No se pudo cargar el perfil de contacto', err);
      setProfile(null);
      setError(err instanceof Error ? err.message : 'No se pudo cargar el contacto');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (user?.id) {
      setParseContentOwner(user.id);
      return;
    }
    setParseContentOwner(profile?.id ?? null);
  }, [user?.id, profile?.id]);

  const value = useMemo<ContactProfileState>(
    () => ({ profile, loading, error, refresh: loadProfile }),
    [profile, loading, error, loadProfile]
  );

  return <ContactProfileContext.Provider value={value}>{children}</ContactProfileContext.Provider>;
};

export const useContactProfile = () => {
  const context = useContext(ContactProfileContext);
  if (!context) {
    throw new Error('useContactProfile must be used within ContactProfileProvider');
  }
  return context;
};
