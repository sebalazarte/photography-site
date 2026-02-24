import { parseRequest, encodeWhere } from '../lib/parseClient.js';
import { deleteFolderPhotoOrders } from './photos.js';

const SITE_ID = (process.env.SITE_ID || process.env.VITE_SITE || '').trim();

const withSiteFilter = (query = {}) => (
  SITE_ID
    ? { ...query, siteId: SITE_ID }
    : { ...query }
);

const buildWhere = (query = {}) => encodeWhere(withSiteFilter(query));

const slugify = (str) =>
  str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    || `galeria-${Date.now()}`;

const galleryFolderKey = (slug) => `galleries/${slug}`;

const sortGalleriesByPosition = (entries = []) => {
  const normalize = (value, fallback) => (Number.isFinite(value) ? value : fallback);
  return [...entries].sort((a, b) => {
    const posA = normalize(a.position, Number.MAX_SAFE_INTEGER);
    const posB = normalize(b.position, Number.MAX_SAFE_INTEGER);
    if (posA !== posB) {
      return posA - posB;
    }
    const slugA = typeof a.slug === 'string' ? a.slug : '';
    const slugB = typeof b.slug === 'string' ? b.slug : '';
    return slugA.localeCompare(slugB);
  });
};

const listGalleries = async () => {
  const where = buildWhere({});
  const data = await parseRequest(`/classes/Gallery?where=${where}&limit=1000`);
  const entries = Array.isArray(data?.results) ? data.results : [];
  return sortGalleriesByPosition(entries).map(({ name, slug, position }) => ({
    name,
    slug,
    position: Number.isFinite(position) ? position : null,
  }));
};

const findGalleryBySlug = async (slug) => {
  const where = buildWhere({ slug });
  const data = await parseRequest(`/classes/Gallery?where=${where}&limit=1`);
  return Array.isArray(data?.results) ? data.results[0] ?? null : null;
};

const ensureUniqueSlug = async (name, existingList) => {
  const base = slugify(name);
  const entries = Array.isArray(existingList) && existingList.length
    ? existingList
    : await listGalleries();
  const existing = new Set(entries.map((gallery) => gallery.slug));
  if (!existing.has(base)) {
    return base;
  }
  let counter = 2;
  let candidate = `${base}-${counter}`;
  while (existing.has(candidate)) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }
  return candidate;
};

const nextPositionFromList = (entries = []) => {
  if (!entries.length) {
    return 0;
  }
  const max = entries.reduce((current, gallery, index) => {
    const value = Number.isFinite(gallery.position) ? gallery.position : index;
    return Math.max(current, value);
  }, -1);
  return max + 1;
};

const createGallery = async (name) => {
  const finalName = name.trim();
  if (!finalName) {
    throw new Error('nombre requerido');
  }
  const existing = await listGalleries();
  const slug = await ensureUniqueSlug(finalName, existing);
  const position = nextPositionFromList(existing);
  await parseRequest('/classes/Gallery', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: finalName,
      slug,
      position,
      ...(SITE_ID ? { siteId: SITE_ID } : {}),
    }),
  });
  return listGalleries();
};

const updateGalleryName = async (slug, name) => {
  const finalName = name.trim();
  if (!finalName) {
    throw new Error('nombre requerido');
  }
  const gallery = await findGalleryBySlug(slug);
  if (!gallery) {
    throw new Error('Galería no encontrada');
  }
  await parseRequest(`/classes/Gallery/${gallery.objectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: finalName }),
  });
  return listGalleries();
};

const deleteGallery = async (slug) => {
  const gallery = await findGalleryBySlug(slug);
  if (!gallery) {
    throw new Error('Galería no encontrada');
  }
  await deleteFolderPhotoOrders(galleryFolderKey(slug));
  await parseRequest(`/classes/Gallery/${gallery.objectId}`, {
    method: 'DELETE',
  });
  return listGalleries();
};

const updateGalleryPositions = async (positions = []) => {
  if (!Array.isArray(positions) || !positions.length) {
    return listGalleries();
  }

  const lookups = new Map();
  for (const { slug } of positions) {
    if (!slug || lookups.has(slug)) continue;
    const gallery = await findGalleryBySlug(slug);
    if (gallery) {
      lookups.set(slug, gallery);
    }
  }

  for (const entry of positions) {
    const gallery = lookups.get(entry.slug);
    if (!gallery || !Number.isFinite(entry.position)) continue;
    await parseRequest(`/classes/Gallery/${gallery.objectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ position: entry.position }),
    });
  }

  return listGalleries();
};

export {
  galleryFolderKey,
  listGalleries,
  createGallery,
  updateGalleryName,
  deleteGallery,
  updateGalleryPositions,
};
