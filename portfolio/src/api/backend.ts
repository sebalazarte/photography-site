const BACKEND_BASE_URL = (import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:4000').trim();
export const BACKEND_ORIGIN = BACKEND_BASE_URL.endsWith('/')
  ? BACKEND_BASE_URL.slice(0, -1)
  : BACKEND_BASE_URL;
export const HAS_BACKEND = Boolean(BACKEND_ORIGIN);

export const backendRequest = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  if (!HAS_BACKEND) {
    throw new Error('Backend no configurado');
  }

  const headers = new Headers(options.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BACKEND_ORIGIN}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  if (!text) {
    if (!response.ok) {
      throw new Error('No se pudo completar la solicitud al backend.');
    }
    return undefined as T;
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error('El backend devolvió una respuesta inválida.');
  }

  if (!response.ok) {
    const message = (data && typeof data === 'object' && 'message' in data && typeof (data as { message?: string }).message === 'string')
      ? (data as { message: string }).message
      : 'No se pudo completar la solicitud al backend.';
    throw new Error(message);
  }

  return data as T;
};

export const isNetworkError = (error: unknown) => error instanceof TypeError;
