import { useCallback, useEffect, useState } from 'react';
import type { StoredPhoto } from '../types/photos';
import { listFolderPhotos } from '../api/photos';

export const useFolderPhotos = (folder?: string) => {
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!folder) {
      setPhotos([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await listFolderPhotos(folder);
      setPhotos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar fotos');
    } finally {
      setLoading(false);
    }
  }, [folder]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { photos, setPhotos, refresh, loading, error };
};
