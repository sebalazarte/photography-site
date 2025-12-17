import {
  PARSE_APP_ID,
  PARSE_BASE_URL,
  PARSE_REST_KEY,
  parseRequest,
  setParseSessionToken,
  getParseSessionToken,
} from './client';

type ParseUser = {
  objectId: string;
  username: string;
  email?: string;
  name?: string;
  phone?: string;
  whatsapp?: string;
  sessionToken?: string;
  acercaDe?: string;
};

type ParseRole = {
  objectId: string;
  name: string;
};

export type AuthenticatedUser = {
  id: string;
  username: string;
  email?: string;
  name?: string;
  phone?: string;
  whatsapp?: string;
  about?: string;
  roles?: string[];
};

export type LoginResult = {
  user: AuthenticatedUser;
  sessionToken: string;
};

const mapParseUser = (user: ParseUser): AuthenticatedUser => ({
  id: user.objectId,
  username: user.username,
  email: user.email,
  name: user.name,
  phone: user.phone,
  whatsapp: user.whatsapp,
  about: user.acercaDe,
});

const fetchUserRoles = async (userId: string): Promise<string[]> => {
  try {
    const where = encodeURIComponent(JSON.stringify({
      users: {
        __type: 'Pointer',
        className: '_User',
        objectId: userId,
      },
    }));
    const data = await parseRequest<{ results?: ParseRole[] }>(`/roles?where=${where}`);
    return data?.results?.map(role => role.name).filter(Boolean) ?? [];
  } catch (error) {
    console.warn('No se pudieron obtener los roles del usuario', error);
    return [];
  }
};

export const parseLogin = async (username: string, password: string): Promise<LoginResult> => {
  const baseUrl = PARSE_BASE_URL || 'https://parseapi.back4app.com';
  const url = new URL(`${baseUrl}/login`);
  url.search = new URLSearchParams({ username, password }).toString();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Parse-Application-Id': PARSE_APP_ID || import.meta.env.VITE_PARSE_APP_ID,
      'X-Parse-REST-API-Key': PARSE_REST_KEY || import.meta.env.VITE_PARSE_REST_KEY,
    },
  });

  if (!response.ok) {
    let message = 'Login failed';
    try {
      const errorPayload = await response.json();
      message = errorPayload?.error || message;
    } catch {
      // ignore body parse errors and use default message
    }
    throw new Error(message);
  }

  const result = (await response.json()) as ParseUser;
  if (!result.sessionToken) {
    throw new Error('Login failed');
  }
  setParseSessionToken(result.sessionToken);
  const user = mapParseUser(result);
  const roles = await fetchUserRoles(result.objectId);

  return { user: { ...user, roles }, sessionToken: result.sessionToken };
};

export const parseLogout = async (): Promise<void> => {
  const sessionToken = getParseSessionToken();
  if (!sessionToken) {
    return;
  }

  const baseUrl = PARSE_BASE_URL || 'https://parseapi.back4app.com';
  await fetch(`${baseUrl}/logout`, {
    method: 'POST',
    headers: {
      'X-Parse-Application-Id': PARSE_APP_ID || import.meta.env.VITE_PARSE_APP_ID,
      'X-Parse-REST-API-Key': PARSE_REST_KEY || import.meta.env.VITE_PARSE_REST_KEY,
      'X-Parse-Session-Token': sessionToken,
    },
  });

  setParseSessionToken(null);
};

export const fetchCurrentUser = async (): Promise<AuthenticatedUser | null> => {
  try {
    const result = await parseRequest<ParseUser>('/users/me');
    const user = mapParseUser(result);
    const roles = await fetchUserRoles(result.objectId);
    return { ...user, roles };
  } catch {
    return null;
  }
};
