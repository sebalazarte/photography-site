import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, parseLogout, type LoginResult } from '../api/auth';
import { setParseContentOwner, setParseSessionToken } from '../api/client';

export type User = {
  id: string;
  username: string;
  email?: string;
  name?: string;
  phone?: string;
  whatsapp?: string;
  about?: string;
};

type AuthSnapshot = {
  user: User;
  sessionToken: string;
};

type AuthValue = {
  user: User | null;
  sessionToken: string | null;
  login: (auth: LoginResult) => void;
  logout: () => Promise<void>;
};

const STORAGE_KEY = 'pp_auth_v1';

const AuthContext = createContext<AuthValue | undefined>(undefined);

const persistSnapshot = (snapshot: AuthSnapshot | null) => {
  if (snapshot) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

const toSnapshot = (auth: LoginResult): AuthSnapshot => ({
  user: {
    id: auth.user.id,
    username: auth.user.username,
    email: auth.user.email,
    name: auth.user.name,
    phone: auth.user.phone,
    whatsapp: auth.user.whatsapp,
    about: auth.user.about,
  },
  sessionToken: auth.sessionToken,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const applyAuth = (snapshot: AuthSnapshot | null) => {
    setUser(snapshot?.user ?? null);
    const token = snapshot?.sessionToken ?? null;
    setSessionToken(token);
    setParseSessionToken(token);
    setParseContentOwner(snapshot?.user?.id ?? null);
    persistSnapshot(snapshot);
  };

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const snapshot = JSON.parse(raw) as AuthSnapshot;
      if (snapshot?.user && snapshot?.sessionToken) {
        applyAuth(snapshot);
        let cancelled = false;
        void (async () => {
          try {
            const current = await fetchCurrentUser();
            if (cancelled) return;
            if (!current) {
              console.warn('Sesión inválida, no se pudo recuperar el usuario actual');
              applyAuth(null);
              return;
            }
            applyAuth({
              user: {
                id: current.id,
                username: current.username,
                email: current.email,
                name: current.name,
                phone: current.phone,
                whatsapp: current.whatsapp,
                about: current.about,
              },
              sessionToken: snapshot.sessionToken,
            });
          } catch (error) {
            if (!cancelled) {
              console.warn('No se pudo validar la sesión guardada', error);
              applyAuth(null);
            }
          }
        })();

        return () => {
          cancelled = true;
        };
      }
    } catch (error) {
      console.warn('No se pudo restaurar la sesión guardada', error);
      persistSnapshot(null);
      setParseContentOwner(null);
    }
  }, []);

  const login = (auth: LoginResult) => {
    const snapshot = toSnapshot(auth);
    applyAuth(snapshot);
  };

  const logout = async () => {
    try {
      await parseLogout();
    } catch (error) {
      console.warn('No se pudo cerrar la sesión en Parse', error);
    } finally {
      applyAuth(null);
    }
  };

  const value = useMemo(() => ({ user, sessionToken, login, logout }), [user, sessionToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
