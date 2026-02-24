export const HOME_FOLDER = 'home';
export const GALLERIES_FOLDER = 'galleries';
export const CONTACT_FOLDER = 'contact';

export const galleryFolderKey = (galleryId: string) => `${GALLERIES_FOLDER}/${galleryId}`;

export const SITE_ID = (import.meta.env.VITE_SITE ?? '').trim();

export const applySiteFilter = <T extends Record<string, unknown>>(query: T) => (
  SITE_ID
    ? { ...query, siteId: SITE_ID }
    : query
);
