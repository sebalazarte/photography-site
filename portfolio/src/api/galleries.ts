import { applySiteFilter, galleryFolderKey, SITE_ID } from '../constants';
import { getParseContentOwner, parseRequest, runParseBatch } from './client';
import { backendRequest, HAS_BACKEND, isNetworkError } from './backend';

const GALLERIES_PATH = '/classes/Gallery';
const PHOTO_ORDER_PATH = '/classes/PhotoOrder';

interface ParseCollection<T> {
  results: T[];
}

interface ParseGallery {
  objectId: string;
  name: string;
  slug: string;
  position?: number | null;
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

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const findGalleryBySlug = async (slug: string): Promise<ParseGallery | null> => {
  const where = encodeURIComponent(JSON.stringify(applySiteFilter({ slug })));
  const data = await parseRequest<ParseCollection<ParseGallery>>(`${GALLERIES_PATH}?where=${where}&limit=1`);
  return data.results[0] ?? null;
};

const deleteFolderPhotoOrders = async (folderKey: string) => {
  const where = encodeURIComponent(JSON.stringify(applySiteFilter({ folderKey })));
  const data = await parseRequest<ParseCollection<{ objectId: string }>>(`${PHOTO_ORDER_PATH}?where=${where}&limit=1000`);
  const ids = data.results.map(item => item.objectId);
  if (!ids.length) return;
  await runParseBatch(ids.map((objectId) => ({
    method: 'DELETE',
    path: `${PHOTO_ORDER_PATH}/${objectId}`,
  })));
};

const ensureUniqueSlug = async (name: string, existing?: GalleryDTO[]) => {
  const base = slugify(name);
  const data = existing ?? await fetchGalleries();
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
  position: number | null;
}

export const updateGalleryPositions = async (entries: { slug: string; position: number }[]) => {
  if (!entries.length) return fetchGalleries();
  if (HAS_BACKEND) {
    try {
      return await backendRequest<GalleryDTO[]>('/api/galleries/positions/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ positions: entries }),
      });
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error instanceof Error ? error : new Error('No se pudo actualizar el orden de las galerías');
      }
      console.warn('No se pudo actualizar el orden de galerías usando el backend, intentando directamente en Parse.', error);
    }
  }

  for (const item of entries) {
    const gallery = await findGalleryBySlug(item.slug);
    if (!gallery) continue;
    await parseRequest(`${GALLERIES_PATH}/${gallery.objectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position: item.position }),
    });
  }

  return fetchGalleries();
};

const sortGalleriesByPosition = <T extends { position?: number | null; slug: string }>(entries: T[]) => {
  const normalizePosition = (value: number | null | undefined, fallback: number) => (
    isFiniteNumber(value) ? value : fallback
  );
  return [...entries].sort((a, b) => {
    const posA = normalizePosition(a.position, Number.MAX_SAFE_INTEGER);
    const posB = normalizePosition(b.position, Number.MAX_SAFE_INTEGER);
    if (posA !== posB) {
      return posA - posB;
    }
    return a.slug.localeCompare(b.slug);
  });
};

const mapToGalleryDTO = (entry: ParseGallery): GalleryDTO => ({
  name: entry.name,
  slug: entry.slug,
  position: isFiniteNumber(entry.position) ? entry.position : null,
});

const computeNextPosition = (existing: GalleryDTO[]) => {
  if (!existing.length) {
    return 0;
  }
  const max = existing.reduce((currentMax, gallery, index) => {
    const value = isFiniteNumber(gallery.position) ? gallery.position : index;
    return Math.max(currentMax, value);
  }, -1);
  return max + 1;
};

export const fetchGalleries = async (_ownerId?: string): Promise<GalleryDTO[]> => {
  const where = encodeURIComponent(JSON.stringify(applySiteFilter({})));
  const data = await parseRequest<ParseCollection<ParseGallery>>(`${GALLERIES_PATH}?where=${where}&limit=1000`);
  const sorted = sortGalleriesByPosition(data.results ?? []);
  return sorted.map(mapToGalleryDTO);
};

export const createGallery = async (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('nombre requerido');
  }

  const ownerId = requireOwnerId();
  const existing = await fetchGalleries(ownerId);
  const slug = await ensureUniqueSlug(trimmed, existing);
  const position = computeNextPosition(existing);
  await parseRequest(GALLERIES_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: trimmed,
      slug,
      position,
      user: buildUserPointer(ownerId),
      ...(SITE_ID ? { siteId: SITE_ID } : {}),
    }),
  });

  return fetchGalleries(ownerId);
};

export const deleteGallery = async (slug: string) => {
  const ownerId = requireOwnerId();
  const gallery = await findGalleryBySlug(slug);
  if (!gallery) {
    throw new Error('Galería no encontrada');
  }

  await deleteFolderPhotoOrders(galleryFolderKey(slug));
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
  const gallery = await findGalleryBySlug(slug);
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
