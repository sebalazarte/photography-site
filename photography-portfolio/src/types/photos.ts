export interface StoredPhoto {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  uploadedAt: string;
  size: number | null;
  group?: number | string | null;
  order?: number;
}
