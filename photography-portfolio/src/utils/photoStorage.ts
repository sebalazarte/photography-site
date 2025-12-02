export type StoredPhoto = {
  id: string;
  name: string;
  url: string;
  date: string;
};

const STORAGE_KEY = 'pp_photo_folders_v1';

type StorageShape = Record<string, StoredPhoto[]>;

const read = (): StorageShape => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const write = (data: StorageShape): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('No se pudo guardar la información de las fotos', error);
    return false;
  }
};

export const listPhotos = (folder: string): StoredPhoto[] => {
  const store = read();
  return store[folder] ?? [];
};

export const savePhotos = (folder: string, photos: StoredPhoto[]): boolean => {
  const store = read();
  store[folder] = photos;
  return write(store);
};

export const appendPhotos = (folder: string, newOnes: StoredPhoto[]): StoredPhoto[] | null => {
  const current = listPhotos(folder);
  const next = [...current, ...newOnes];
  return savePhotos(folder, next) ? next : null;
};

export const removePhoto = (folder: string, photoId: string): StoredPhoto[] | null => {
  const current = listPhotos(folder);
  const next = current.filter(p => p.id !== photoId);
  return savePhotos(folder, next) ? next : null;
};
