import { absolutizeFromApi, getParseContentOwner, parseRequest, runParseBatch, uploadParseFile } from './client';
import { applySiteFilter, SITE_ID, HOME_FOLDER } from '../constants';
import type { StoredPhoto } from '../types/photos';
import { backendRequest, HAS_BACKEND, isNetworkError } from './backend';

const PHOTO_ORDER_PATH = '/classes/PhotoOrder';

interface ParseCollection<T> {
  results: T[];
}

interface ParsePhotoOrder {
  objectId: string;
  folderKey: string;
  photoId?: string;
  position?: number;
  originalName?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
  photoFile?: {
    __type: 'File';
    name: string;
    url: string;
  };
  user?: {
    objectId: string;
  };
}

const resolveOwnerId = (ownerId?: string) => {
  const resolved = ownerId ?? getParseContentOwner();
  return resolved || null;
};

const requireOwnerId = (ownerId?: string) => {
  const resolved = resolveOwnerId(ownerId);
  if (!resolved) {
    throw new Error('No hay un usuario activo para operar sobre fotos.');
  }
  return resolved;
};

const buildUserPointer = (ownerId: string) => ({
  __type: 'Pointer' as const,
  className: '_User',
  objectId: ownerId,
});

const mapToStoredPhoto = (entry: ParsePhotoOrder, index: number): StoredPhoto => ({
  id: entry.objectId,
  filename: entry.photoId ?? entry.photoFile?.name ?? entry.objectId,
  originalName: entry.originalName ?? entry.photoId ?? entry.photoFile?.name ?? 'Foto sin título',
  url: entry.photoFile?.url ? absolutizeFromApi(entry.photoFile.url) : '',
  uploadedAt: entry.updatedAt ?? entry.createdAt,
  size: entry.fileSize ?? null,
  order: index,
});

const fetchPhotoOrders = async (folder: string) => {
  const where = encodeURIComponent(JSON.stringify(applySiteFilter({ folderKey: folder })));
  const data = await parseRequest<ParseCollection<ParsePhotoOrder>>(`${PHOTO_ORDER_PATH}?where=${where}&order=position,createdAt&limit=1000`);
  const sorted = [...data.results].sort((a, b) => {
    const posA = Number.isFinite(a.position) ? (a.position as number) : Number.MAX_SAFE_INTEGER;
    const posB = Number.isFinite(b.position) ? (b.position as number) : Number.MAX_SAFE_INTEGER;
    if (posA !== posB) return posA - posB;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  let needsNormalization = false;
  sorted.forEach((item, index) => {
    if (!Number.isFinite(item.position) || (item.position as number) !== index) {
      needsNormalization = true;
    }
  });
  const mapped = sorted.map((entry, index) => mapToStoredPhoto(entry, index));
  if (needsNormalization && sorted.length) {
    const requests = sorted.map((entry, index) => ({
      method: 'PUT' as const,
      path: `${PHOTO_ORDER_PATH}/${entry.objectId}`,
      body: { position: index },
    }));
    await runParseBatch(requests);
  }
  return mapped;
};

export const listFolderPhotos = async (folder: string) => fetchPhotoOrders(folder);

export const uploadToFolder = async (folder: string, files: FileList | File[]) => {
  const iterable = files instanceof FileList ? Array.from(files) : files;
  if (!iterable.length) {
    return fetchPhotoOrders(folder);
  }

  const ownerId = requireOwnerId();
  const existing = await fetchPhotoOrders(folder);
  let nextPosition = existing.length;

  for (const file of iterable) {
    const uploaded = await uploadParseFile(file);
    const body = {
      folderKey: folder,
      photoId: uploaded.name,
      position: nextPosition,
      originalName: file.name,
      fileSize: file.size,
      photoFile: {
        __type: 'File' as const,
        name: uploaded.name,
      },
      user: buildUserPointer(ownerId),
      ...(SITE_ID ? { siteId: SITE_ID } : {}),
    };
    nextPosition += 1;
    await parseRequest(PHOTO_ORDER_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  return fetchPhotoOrders(folder);
};

export const deletePhotoFromFolder = async (folder: string, photoId: string) => {
  if (HAS_BACKEND) {
    const params = new URLSearchParams({ folder, id: photoId });
    try {
      return await backendRequest<StoredPhoto[]>(`/api/photos?${params.toString()}`, {
        method: 'DELETE',
      });
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error instanceof Error ? error : new Error('No se pudo eliminar la foto.');
      }
      console.warn('Fallo el backend al eliminar la foto, usando Parse directamente', error);
    }
  }
  requireOwnerId();
  await parseRequest(`${PHOTO_ORDER_PATH}/${photoId}`, {
    method: 'DELETE',
  });
  return fetchPhotoOrders(folder);
};

export const swapPhotoPositions = async (folder: string, sourceId: string, targetId: string) => {
  if (sourceId === targetId) {
    return fetchPhotoOrders(folder);
  }

  requireOwnerId();

  if (HAS_BACKEND) {
    try {
      return await backendRequest<StoredPhoto[]>('/api/photos/order/swap', {
        method: 'PUT',
        body: JSON.stringify({ folder, sourceId, targetId }),
      });
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error instanceof Error ? error : new Error('No se pudo intercambiar el orden.');
      }
      console.warn('Fallo el backend al intercambiar posiciones, usando Parse directamente', error);
    }
  }

  const [source, target] = await Promise.all([
    parseRequest<ParsePhotoOrder>(`${PHOTO_ORDER_PATH}/${sourceId}`),
    parseRequest<ParsePhotoOrder>(`${PHOTO_ORDER_PATH}/${targetId}`),
  ]);

  if (!source || !target) {
    throw new Error('No se encontraron las fotos para intercambiar.');
  }

  if (source.folderKey !== folder || target.folderKey !== folder) {
    throw new Error('Las fotos no pertenecen al folder solicitado.');
  }

  const sourcePosition = Number.isFinite(source.position) ? (source.position as number) : null;
  const targetPosition = Number.isFinite(target.position) ? (target.position as number) : null;

  if (sourcePosition === null || targetPosition === null) {
    throw new Error('No se pudo determinar la posición actual de las fotos.');
  }

  await runParseBatch([
    {
      method: 'PUT' as const,
      path: `${PHOTO_ORDER_PATH}/${sourceId}`,
      body: { position: targetPosition },
    },
    {
      method: 'PUT' as const,
      path: `${PHOTO_ORDER_PATH}/${targetId}`,
      body: { position: sourcePosition },
    },
  ]);

  return fetchPhotoOrders(folder);
};

export const updatePhotoOrder = async (folder: string, order: string[]) => {
  requireOwnerId();
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
  return fetchPhotoOrders(folder);
};

export const featurePhotoOnHome = async (photo: StoredPhoto) => {
  const ownerId = requireOwnerId();
  const fileName = photo.filename?.trim() || photo.id;
  if (!fileName) {
    throw new Error('La foto seleccionada no tiene un archivo asociado.');
  }

  const homePhotos = await fetchPhotoOrders(HOME_FOLDER);
  if (homePhotos.some(item => item.filename === fileName || item.id === photo.id)) {
    return false;
  }

  const body = {
    folderKey: HOME_FOLDER,
    photoId: fileName,
    position: homePhotos.length,
    originalName: photo.originalName,
    fileSize: photo.size ?? null,
    photoFile: {
      __type: 'File' as const,
      name: fileName,
    },
    user: buildUserPointer(ownerId),
    ...(SITE_ID ? { siteId: SITE_ID } : {}),
  };

  await parseRequest(PHOTO_ORDER_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return true;
};
