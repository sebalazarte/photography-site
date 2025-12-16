import { parseRequest, setParseSessionToken } from './client';

interface ParseUser {
  objectId: string;
  username: string;
  email?: string;
  sessionToken: string;
}

interface ParseLoginResponse extends ParseUser {
  createdAt: string;
  updatedAt: string;
}

export interface LoginResult {
  user: {
    id: string;
    username: string;
    email?: string;
  };
  sessionToken: string;
}

export const parseLogin = async (username: string, password: string): Promise<LoginResult> => {
  const params = new URLSearchParams({ username, password });
  const data = await parseRequest<ParseLoginResponse>(`/login?${params.toString()}`);
  const result: LoginResult = {
    user: {
      id: data.objectId,
      username: data.username,
      email: data.email,
    },
    sessionToken: data.sessionToken,
  };
  setParseSessionToken(data.sessionToken);
  return result;
};

export const parseLogout = async () => {
  try {
    await parseRequest('/logout', {
      method: 'POST',
    });
  } finally {
    setParseSessionToken(null);
  }
};

export const fetchCurrentUser = async (): Promise<LoginResult['user'] | null> => {
  try {
    const data = await parseRequest<ParseUser>('/users/me');
    if (!data) return null;
    return {
      id: data.objectId,
      username: data.username,
      email: data.email,
    };
  } catch (error) {
    console.warn('No se pudo verificar la sesión Parse', error);
    return null;
  }
};
