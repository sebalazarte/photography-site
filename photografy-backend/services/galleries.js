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

const listGalleries = async () => {
  const where = buildWhere({});
  const data = await parseRequest(`/classes/Gallery?where=${where}&order=slug`);
  return Array.isArray(data?.results)
    ? data.results.map(({ name, slug }) => ({ name, slug }))
    : [];
};

const findGalleryBySlug = async (slug) => {
  const where = buildWhere({ slug });
  const data = await parseRequest(`/classes/Gallery?where=${where}&limit=1`);
  return Array.isArray(data?.results) ? data.results[0] ?? null : null;
};

const ensureUniqueSlug = async (name) => {
  const base = slugify(name);
  const where = buildWhere({});
  const data = await parseRequest(`/classes/Gallery?where=${where}&limit=1000`);
  const existing = new Set((data?.results ?? []).map((gallery) => gallery.slug));
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

const createGallery = async (name) => {
  const finalName = name.trim();
  if (!finalName) {
    throw new Error('nombre requerido');
  }
  const slug = await ensureUniqueSlug(finalName);
  await parseRequest('/classes/Gallery', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: finalName,
      slug,
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

export {
  galleryFolderKey,
  listGalleries,
  createGallery,
  updateGalleryName,
  deleteGallery,
};
