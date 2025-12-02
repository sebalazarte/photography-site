const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

const apiOrigin = (() => {
  try {
    return new URL(API_BASE).origin;
  } catch (error) {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.origin;
    }
    console.warn('No se pudo determinar API origin', error);
    return '';
  }
})();

export const absolutizeFromApi = (maybeRelative: string) => {
  if (/^https?:\/\//i.test(maybeRelative)) {
    return maybeRelative;
  }
  if (!maybeRelative.startsWith('/')) {
    return `${apiOrigin}/${maybeRelative}`;
  }
  return `${apiOrigin}${maybeRelative}`;
};

export const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Error en la solicitud');
  }
  return response.json() as Promise<T>;
};

export { API_BASE, apiOrigin as API_ORIGIN };
