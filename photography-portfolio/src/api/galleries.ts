import { request } from './client';

export interface GalleryDTO {
  name: string;
  slug: string;
}

export const fetchGalleries = () => request<GalleryDTO[]>('/galleries');

export const createGallery = (name: string) => request<GalleryDTO[]>('/galleries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name }),
});

export const deleteGallery = (slug: string) => request<GalleryDTO[]>(`/galleries/${slug}`, {
  method: 'DELETE',
});

export const updateGalleryName = (slug: string, name: string) => request<GalleryDTO[]>(`/galleries/${slug}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name }),
});
