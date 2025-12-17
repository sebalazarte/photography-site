import { backendRequest, HAS_BACKEND, isNetworkError } from './backend';
import { parseRequest } from './client';
import { SITE_ID } from '../constants';
import type { ContactProfile } from './users';

interface ParseSiteRecord {
  objectId: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  acercaDe?: string | null;
  slug?: string | null;
  handle?: string | null;
}

const ensureSiteId = () => {
  const siteId = SITE_ID;
  if (!siteId) {
    throw new Error('No hay un sitio configurado. Define VITE_SITE en el archivo .env.');
  }
  return siteId;
};

const sanitizeValue = (value?: string | null) => {
  if (value === null || value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const mapToContactProfile = (record: ParseSiteRecord): ContactProfile => {
  const identifier = sanitizeValue(record.slug) ?? sanitizeValue(record.handle) ?? record.objectId;
  return {
    id: record.objectId,
    username: identifier,
    name: sanitizeValue(record.name) ?? identifier,
    email: sanitizeValue(record.email),
    phone: sanitizeValue(record.phone),
    whatsapp: sanitizeValue(record.whatsapp),
    about: sanitizeValue(record.acercaDe),
  };
};

const fetchSiteEntryFromParse = async (): Promise<ParseSiteRecord | null> => {
  const siteId = ensureSiteId();
  const where = encodeURIComponent(JSON.stringify({ siteId }));
  const data = await parseRequest<{ results?: ParseSiteRecord[] }>(`/classes/Site?where=${where}&limit=1`);
  const entry = data?.results?.[0];
  return entry ?? null;
};

const fetchSiteProfileFromParse = async (): Promise<ContactProfile | null> => {
  const entry = await fetchSiteEntryFromParse();
  if (!entry) return null;
  return mapToContactProfile(entry);
};

const buildSiteQuery = () => `siteId=${encodeURIComponent(ensureSiteId())}`;

export const fetchSiteProfile = async (): Promise<ContactProfile | null> => {
  if (HAS_BACKEND) {
    try {
      const query = buildSiteQuery();
      return await backendRequest<ContactProfile | null>(`/api/site?${query}`);
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error instanceof Error ? error : new Error('No se pudo obtener el sitio');
      }
      console.warn('No se pudo contactar al backend, usando Parse para Site', error);
    }
  }
  return fetchSiteProfileFromParse();
};

export interface UpdateSiteProfileInput {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  about?: string;
}

type NormalizedSiteInput = {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  about: string;
};

const normalizeInput = (input: UpdateSiteProfileInput = {}): NormalizedSiteInput => ({
  name: sanitizeValue(input.name) ?? '',
  email: sanitizeValue(input.email) ?? '',
  phone: sanitizeValue(input.phone) ?? '',
  whatsapp: sanitizeValue(input.whatsapp) ?? '',
  about: sanitizeValue(input.about) ?? '',
});

const buildParsePayload = (input: NormalizedSiteInput) => {
  const payload: Record<string, string | null> = {};
  const assign = (key: keyof NormalizedSiteInput, targetField?: string) => {
    if (input[key] === undefined) return;
    payload[targetField ?? key] = input[key] || null;
  };
  assign('name');
  assign('email');
  assign('phone');
  assign('whatsapp');
  assign('about', 'acercaDe');
  return payload;
};

const ensureSiteEntry = async () => fetchSiteEntryFromParse();

const updateSiteProfileViaParse = async (input: NormalizedSiteInput) => {
  const siteId = ensureSiteId();
  const payload = buildParsePayload(input);
  const existing = await ensureSiteEntry();

  if (!existing) {
    await parseRequest('/classes/Site', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ siteId, ...payload }),
    });
    return fetchSiteProfileFromParse();
  }

  if (Object.keys(payload).length) {
    await parseRequest(`/classes/Site/${existing.objectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  return fetchSiteProfileFromParse();
};

export const updateSiteProfile = async (input: UpdateSiteProfileInput) => {
  const normalized = normalizeInput(input);
  if (HAS_BACKEND) {
    try {
      const query = buildSiteQuery();
      return await backendRequest<ContactProfile>(`/api/site?${query}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(normalized),
      });
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error instanceof Error ? error : new Error('No se pudo actualizar el sitio');
      }
      console.warn('No se pudo usar el backend para actualizar el sitio, usando Parse', error);
    }
  }
  return updateSiteProfileViaParse(normalized);
};