import { galleryFolderKey } from '../constants';
import { getParseContentOwner, parseRequest, runParseBatch } from './client';

const GALLERIES_PATH = '/classes/Gallery';
const PHOTO_ORDER_PATH = '/classes/PhotoOrder';

interface ParseCollection<T> {
  results: T[];
}

interface ParseGallery {
  objectId: string;
  name: string;
  slug: string;
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
    throw new Error('No hay un usuario activo para operar sobre galerías.');
  }
  return resolved;
};

const buildUserPointer = (ownerId: string) => ({
  __type: 'Pointer' as const,
  className: '_User',
  objectId: ownerId,
});

const slugify = (value: string) =>
  value
    .normalize('NFD').replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    || `galeria-${Date.now()}`;

const findGalleryBySlug = async (slug: string, ownerId?: string): Promise<ParseGallery | null> => {
  const resolvedOwnerId = resolveOwnerId(ownerId);
  if (!resolvedOwnerId) return null;
  const where = encodeURIComponent(JSON.stringify({
    slug,
    user: buildUserPointer(resolvedOwnerId),
  }));
  const data = await parseRequest<ParseCollection<ParseGallery>>(`${GALLERIES_PATH}?where=${where}&limit=1`);
  return data.results[0] ?? null;
};

const deleteFolderPhotoOrders = async (folderKey: string, ownerId: string) => {
  const where = encodeURIComponent(JSON.stringify({
    folderKey,
    user: buildUserPointer(ownerId),
  }));
  const data = await parseRequest<ParseCollection<{ objectId: string }>>(`${PHOTO_ORDER_PATH}?where=${where}&limit=1000`);
  const ids = data.results.map(item => item.objectId);
  if (!ids.length) return;
  await runParseBatch(ids.map((objectId) => ({
    method: 'DELETE',
    path: `/parse/classes/PhotoOrder/${objectId}`,
  })));
};

const ensureUniqueSlug = async (name: string, ownerId: string) => {
  const base = slugify(name);
  const data = await fetchGalleries(ownerId);
  const taken = new Set(data.map(gallery => gallery.slug));
  if (!taken.has(base)) {
    return base;
  }

  let counter = 2;
  let candidate = `${base}-${counter}`;
  while (taken.has(candidate)) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }
  return candidate;
};

export interface GalleryDTO {
  name: string;
  slug: string;
}

export const fetchGalleries = async (ownerId?: string): Promise<GalleryDTO[]> => {
  const resolvedOwnerId = resolveOwnerId(ownerId);
  if (!resolvedOwnerId) return [];
  const where = encodeURIComponent(JSON.stringify({ user: buildUserPointer(resolvedOwnerId) }));
  const data = await parseRequest<ParseCollection<ParseGallery>>(`${GALLERIES_PATH}?where=${where}&order=slug`);
  return data.results.map(({ name, slug }) => ({ name, slug }));
};

export const createGallery = async (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('nombre requerido');
  }

  const ownerId = requireOwnerId();
  const slug = await ensureUniqueSlug(trimmed, ownerId);
  await parseRequest(GALLERIES_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: trimmed,
      slug,
      user: buildUserPointer(ownerId),
    }),
  });

  return fetchGalleries(ownerId);
};

export const deleteGallery = async (slug: string) => {
  const ownerId = requireOwnerId();
  const gallery = await findGalleryBySlug(slug, ownerId);
  if (!gallery) {
    throw new Error('Galería no encontrada');
  }

  await deleteFolderPhotoOrders(galleryFolderKey(slug), ownerId);
  await parseRequest(`${GALLERIES_PATH}/${gallery.objectId}`, {
    method: 'DELETE',
  });

  return fetchGalleries(ownerId);
};

export const updateGalleryName = async (slug: string, name: string) => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('nombre requerido');
  }

  const ownerId = requireOwnerId();
  const gallery = await findGalleryBySlug(slug, ownerId);
  if (!gallery) {
    throw new Error('Galería no encontrada');
  }

  await parseRequest(`${GALLERIES_PATH}/${gallery.objectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: trimmed }),
  });

  return fetchGalleries(ownerId);
};
