import { parseRequest, uploadParseFile, encodeWhere, runBatch } from '../lib/parseClient.js';

const SITE_ID = (process.env.SITE_ID || process.env.VITE_SITE || '').trim();

const withSiteFilter = (query = {}) => (
  SITE_ID
    ? { ...query, siteId: SITE_ID }
    : { ...query }
);

const buildWhere = (query = {}) => encodeWhere(withSiteFilter(query));

const GROUP_OBJECT_KEYS = ['value', 'name', 'label', 'title', 'slug', 'code', 'displayName', 'objectId', 'id'];
const GROUP_FIELD_CANDIDATES = ['group', 'grupo', 'groupId', 'groupNumber', 'groupValue', 'homeGroup'];

const normalizeGroupValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : trimmed;
  }
  if (value && typeof value === 'object') {
    for (const key of GROUP_OBJECT_KEYS) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const nested = normalizeGroupValue(value[key]);
        if (nested !== null) {
          return nested;
        }
      }
    }
  }
  return null;
};

const extractEntryGroup = (entry = {}) => {
  for (const field of GROUP_FIELD_CANDIDATES) {
    if (Object.prototype.hasOwnProperty.call(entry, field)) {
      const candidate = entry[field];
      const normalized = normalizeGroupValue(candidate);
      if (normalized !== null) {
        return normalized;
      }
    }
  }
  return null;
};

const resolveGroupInput = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error('grupo requerido');
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  throw new Error('grupo inválido');
};

const compareGroups = (left, right) => {
  const groupA = extractEntryGroup(left);
  const groupB = extractEntryGroup(right);
  if (groupA === groupB) {
    return 0;
  }
  if (groupA === null) {
    return 1;
  }
  if (groupB === null) {
    return -1;
  }
  if (typeof groupA === 'number' && typeof groupB === 'number') {
    return groupA - groupB;
  }
  const textA = String(groupA);
  const textB = String(groupB);
  const localeResult = textA.localeCompare(textB, undefined, { sensitivity: 'base', numeric: true });
  if (localeResult !== 0) {
    return localeResult;
  }
  return textA < textB ? -1 : 1;
};

const mapPhoto = (entry, index) => ({
  id: entry.objectId,
  filename: entry.photoId ?? entry.photoFile?.name ?? entry.objectId,
  originalName: entry.originalName ?? entry.photoId ?? entry.photoFile?.name ?? 'Foto sin título',
  url: entry.photoFile?.url ?? '',
  uploadedAt: entry.updatedAt ?? entry.createdAt,
  size: entry.fileSize ?? null,
  group: extractEntryGroup(entry),
  order: index,
});

const sortPhotoEntries = (entries) => {
  const sorted = [...entries].sort((a, b) => {
    const groupResult = compareGroups(a, b);
    if (groupResult !== 0) {
      return groupResult;
    }
    const posA = Number.isFinite(a.position) ? a.position : Number.MAX_SAFE_INTEGER;
    const posB = Number.isFinite(b.position) ? b.position : Number.MAX_SAFE_INTEGER;
    if (posA !== posB) return posA - posB;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  let needsNormalization = false;
  sorted.forEach((item, index) => {
    if (!Number.isFinite(item.position) || item.position !== index) {
      needsNormalization = true;
    }
  });

  return { sorted, needsNormalization };
};

const listPhotos = async (folderKey) => {
  const where = buildWhere({ folderKey });
  const data = await parseRequest(`/classes/PhotoOrder?where=${where}&order=position,createdAt&limit=1000&include=group`);
  const entries = Array.isArray(data?.results) ? data.results : [];

  const { sorted, needsNormalization } = sortPhotoEntries(entries);

  if (needsNormalization) {
    const requests = sorted.map((entry, index) => ({
      method: 'PUT',
      path: `/classes/PhotoOrder/${entry.objectId}`,
      body: { position: index },
    }));
    await runBatch(requests);
    sorted.forEach((entry, index) => {
      entry.position = index;
    });
  }

  return sorted.map(mapPhoto);
};

const uploadPhotos = async (folderKey, files) => {
  const existing = await listPhotos(folderKey);
  let nextPosition = existing.length;

  for (const file of files) {
    const uploaded = await uploadParseFile(file);
    const body = {
      folderKey,
      photoId: uploaded.name,
      position: nextPosition,
      originalName: file.originalname,
      fileSize: file.size,
      photoFile: {
        __type: 'File',
        name: uploaded.name,
      },
    };
    nextPosition += 1;
    await parseRequest('/classes/PhotoOrder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        ...(SITE_ID ? { siteId: SITE_ID } : {}),
      }),
    });
  }

  return listPhotos(folderKey);
};

const deletePhoto = async (folderKey, photoId) => {
  await parseRequest(`/classes/PhotoOrder/${photoId}`, {
    method: 'DELETE',
  });
  return listPhotos(folderKey);
};

const updatePhotoOrder = async (folderKey, order) => {
  for (let index = 0; index < order.length; index += 1) {
    const objectId = order[index];
    await parseRequest(`/classes/PhotoOrder/${objectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ position: index }),
    });
  }
  return listPhotos(folderKey);
};

const swapPhotoPositions = async (folderKey, sourceId, targetId) => {
  if (sourceId === targetId) {
    return listPhotos(folderKey);
  }

  const [source, target] = await Promise.all([
    parseRequest(`/classes/PhotoOrder/${sourceId}`),
    parseRequest(`/classes/PhotoOrder/${targetId}`),
  ]);

  if (!source || !target) {
    throw new Error('No se encontraron las fotos para intercambiar.');
  }

  if (source.folderKey !== folderKey || target.folderKey !== folderKey) {
    throw new Error('Las fotos no pertenecen al folder indicado.');
  }

  const sourcePosition = Number.isFinite(source.position) ? source.position : null;
  const targetPosition = Number.isFinite(target.position) ? target.position : null;

  if (sourcePosition === null || targetPosition === null) {
    throw new Error('Las fotos no tienen posiciones válidas para intercambiar.');
  }

  await runBatch([
    {
      method: 'PUT',
      path: `/classes/PhotoOrder/${sourceId}`,
      body: { position: targetPosition },
    },
    {
      method: 'PUT',
      path: `/classes/PhotoOrder/${targetId}`,
      body: { position: sourcePosition },
    },
  ]);

  return listPhotos(folderKey);
};

const deleteFolderPhotoOrders = async (folderKey) => {
  const where = buildWhere({ folderKey });
  const data = await parseRequest(`/classes/PhotoOrder?where=${where}&limit=1000`);
  const entries = Array.isArray(data?.results) ? data.results : [];
  if (!entries.length) return;
  const requests = entries.map((entry) => ({
    method: 'DELETE',
    path: `/classes/PhotoOrder/${entry.objectId}`,
  }));
  await runBatch(requests);
};

const clearFolderPhotos = async (folderKey) => {
  await deleteFolderPhotoOrders(folderKey);
  return listPhotos(folderKey);
};

const assignPhotoGroup = async (folderKey, photoIds = [], groupValue) => {
  const uniqueIds = Array.from(new Set(Array.isArray(photoIds) ? photoIds : [])).filter((id) => typeof id === 'string' && id.trim());
  if (!uniqueIds.length) {
    return listPhotos(folderKey);
  }
  const finalGroup = resolveGroupInput(groupValue);
  const payload = { group: finalGroup, grupo: finalGroup };
  const requests = uniqueIds.map((photoId) => ({
    method: 'PUT',
    path: `/classes/PhotoOrder/${photoId}`,
    body: payload,
  }));
  await runBatch(requests);
  return listPhotos(folderKey);
};

export {
  mapPhoto,
  listPhotos,
  uploadPhotos,
  deletePhoto,
  updatePhotoOrder,
  swapPhotoPositions,
  clearFolderPhotos,
  deleteFolderPhotoOrders,
  assignPhotoGroup,
};
