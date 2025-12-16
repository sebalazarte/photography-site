const PARSE_BASE_URL = import.meta.env.VITE_PARSE_SERVER_URL ?? 'https://parseapi.back4app.com';
const PARSE_APP_ID = import.meta.env.VITE_PARSE_APP_ID ?? 'WMyRpr7dIqcjtxgc6IufMYq4UDuyAk9lmNaBkJcX';
const PARSE_REST_KEY = import.meta.env.VITE_PARSE_REST_KEY ?? 'icQrdQd7nLlRVc34HONyO3OKoZHZGFHB2wVKRypg';
const PARSE_JS_KEY = import.meta.env.VITE_PARSE_JS_KEY ?? '';
let parseSessionToken = import.meta.env.VITE_PARSE_SESSION_TOKEN ?? '';

export const setParseSessionToken = (token: string | null | undefined) => {
  parseSessionToken = token ?? '';
};

export const getParseSessionToken = () => parseSessionToken;

export const absolutizeFromApi = (maybeAbsolute: string) => maybeAbsolute;

const withParseHeaders = (inputHeaders?: HeadersInit) => {
  const headers = new Headers(inputHeaders);
  headers.set('X-Parse-Application-Id', PARSE_APP_ID);
  headers.set('X-Parse-REST-API-Key', PARSE_REST_KEY);
  if (PARSE_JS_KEY) {
    headers.set('X-Parse-JavaScript-Key', PARSE_JS_KEY);
  }
  if (parseSessionToken) {
    headers.set('X-Parse-Session-Token', parseSessionToken);
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  return headers;
};

export interface ParseRequestOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | null;
}

export const parseRequest = async <T>(path: string, options: ParseRequestOptions = {}): Promise<T> => {
  const headers = withParseHeaders(options.headers);
  const response = await fetch(`${PARSE_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const raw = await response.text();
  if (!response.ok) {
    let message = raw || 'Error en la solicitud';
    try {
      const payload = raw ? JSON.parse(raw) : null;
      message = payload?.error || payload?.message || message;
    } catch {
      // ignore JSON parse errors and fall back to raw message
    }
    throw new Error(message);
  }

  if (!raw) {
    return undefined as T;
  }

  return JSON.parse(raw) as T;
};

export interface ParseFileUploadResult {
  name: string;
  url: string;
}

export const uploadParseFile = async (file: File): Promise<ParseFileUploadResult> => {
  const headers = withParseHeaders({
    'Content-Type': file.type || 'application/octet-stream',
  });
  const response = await fetch(`${PARSE_BASE_URL}/files/${encodeURIComponent(file.name)}`, {
    method: 'POST',
    body: file,
    headers,
  });

  const raw = await response.text();
  if (!response.ok) {
    let message = raw || 'No se pudo subir el archivo';
    try {
      const payload = raw ? JSON.parse(raw) : null;
      message = payload?.error || payload?.message || message;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  return JSON.parse(raw) as ParseFileUploadResult;
};

export interface ParseBatchRequest {
  method: 'POST' | 'PUT' | 'DELETE' | 'GET';
  path: string;
  body?: Record<string, unknown>;
}

const BATCH_LIMIT = 50;

export const runParseBatch = async (requests: ParseBatchRequest[]) => {
  if (!requests.length) return;
  for (let index = 0; index < requests.length; index += BATCH_LIMIT) {
    const chunk = requests.slice(index, index + BATCH_LIMIT);
    await parseRequest('/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: chunk }),
    });
  }
};

export { PARSE_APP_ID, PARSE_BASE_URL, PARSE_REST_KEY };
