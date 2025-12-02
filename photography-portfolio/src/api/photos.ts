import { request, absolutizeFromApi } from './client';
import type { StoredPhoto } from '../types/photos';

const encodeFolder = (folder: string) => encodeURIComponent(folder);

const normalizePhotoUrls = (photos: StoredPhoto[]) =>
  photos.map(photo => ({
    ...photo,
    url: absolutizeFromApi(photo.url)
  }));

export const listFolderPhotos = (folder: string) =>
  request<StoredPhoto[]>(`/photos?folder=${encodeFolder(folder)}`)
    .then(normalizePhotoUrls);

export const uploadToFolder = async (folder: string, files: FileList | File[]) => {
  const payload = new FormData();
  const iterable = files instanceof FileList ? Array.from(files) : files;
  iterable.forEach(file => payload.append('photos', file));
  const response = await request<StoredPhoto[]>(`/photos?folder=${encodeFolder(folder)}`, {
    method: 'POST',
    body: payload,
  });
  return normalizePhotoUrls(response);
};

export const deletePhotoFromFolder = (folder: string, filename: string) =>
  request<StoredPhoto[]>(`/photos?folder=${encodeFolder(folder)}&filename=${encodeURIComponent(filename)}`, {
    method: 'DELETE',
  }).then(normalizePhotoUrls);
