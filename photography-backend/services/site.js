import { parseRequest, encodeWhere } from '../lib/parseClient.js';

const ensureSiteId = (siteId) => {
  if (typeof siteId !== 'string' || !siteId.trim()) {
    throw new Error('siteId requerido');
  }
  return siteId.trim();
};

const sanitizeValue = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const mapSiteRecord = (record) => {
  if (!record) return null;
  const identifier = sanitizeValue(record.slug)
    || sanitizeValue(record.handle)
    || record.objectId;

  return {
    id: record.objectId,
    username: identifier,
    name: sanitizeValue(record.name) || identifier,
    email: sanitizeValue(record.email),
    phone: sanitizeValue(record.phone),
    whatsapp: sanitizeValue(record.whatsapp),
    about: sanitizeValue(record.acercaDe),
  };
};

const fetchSiteRecord = async (siteId) => {
  const id = ensureSiteId(siteId);
  const where = encodeWhere({ siteId: id });
  const data = await parseRequest(`/classes/Site?where=${where}&limit=1`);
  const results = Array.isArray(data?.results) ? data.results : [];
  return results[0] ?? null;
};

const getSiteProfile = async (siteId) => {
  try {
    const record = await fetchSiteRecord(siteId);
    return mapSiteRecord(record);
  } catch (error) {
    if (error instanceof Error && /object not found/i.test(error.message)) {
      return null;
    }
    throw error;
  }
};

const buildUpdatePayload = (input = {}) => {
  const payload = {};
  const assignField = (field, value, target = field) => {
    if (value === undefined) return;
    const trimmed = typeof value === 'string' ? value.trim() : '';
    payload[target] = trimmed || null;
  };

  assignField('name', input.name);
  assignField('email', input.email);
  assignField('phone', input.phone);
  assignField('whatsapp', input.whatsapp);
  assignField('about', input.about, 'acercaDe');

  return payload;
};

const buildAboutPayload = (value) => {
  if (value === undefined) {
    throw new Error('El campo about es requerido');
  }
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return { acercaDe: trimmed || null };
};

const updateSiteProfile = async (siteId, input = {}) => {
  const id = ensureSiteId(siteId);
  const payload = buildUpdatePayload(input);
  const existing = await fetchSiteRecord(id);

  if (!existing) {
    await parseRequest('/classes/Site', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ siteId: id, ...payload }),
    });
    return getSiteProfile(id);
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

  return getSiteProfile(id);
};

const updateSiteAbout = async (siteId, about) => {
  const id = ensureSiteId(siteId);
  const payload = buildAboutPayload(about);
  const existing = await fetchSiteRecord(id);

  if (!existing) {
    await parseRequest('/classes/Site', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ siteId: id, ...payload }),
    });
    return getSiteProfile(id);
  }

  await parseRequest(`/classes/Site/${existing.objectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return getSiteProfile(id);
};

export {
  getSiteProfile,
  updateSiteProfile,
  updateSiteAbout,
};