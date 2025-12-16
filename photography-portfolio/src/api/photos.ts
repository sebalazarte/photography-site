import { absolutizeFromApi, parseRequest, runParseBatch, uploadParseFile } from './client';
import type { StoredPhoto } from '../types/photos';

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
}

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
  const where = encodeURIComponent(JSON.stringify({ folderKey: folder }));
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
      path: `/parse/classes/PhotoOrder/${entry.objectId}`,
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
  await parseRequest(`${PHOTO_ORDER_PATH}/${photoId}`, {
    method: 'DELETE',
  });
  return fetchPhotoOrders(folder);
};

export const updatePhotoOrder = async (folder: string, order: string[]) => {
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
