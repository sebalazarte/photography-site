import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StoredPhoto } from '../types/photos';
import { listFolderPhotos } from '../api/photos';
import { useAuth } from '../context/AuthContext';
import { useContactProfile } from '../context/ContactProfileContext';

export const useFolderPhotos = (folder?: string) => {
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { profile } = useContactProfile();
  const ownerId = useMemo(() => user?.id ?? profile?.id ?? null, [user?.id, profile?.id]);

  const refresh = useCallback(async () => {
    if (!folder) {
      setPhotos([]);
      return;
    }
    if (!ownerId) {
      setPhotos([]);
      setError(null);
      setLoading(Boolean(folder));
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
  }, [folder, ownerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { photos, setPhotos, refresh, loading, error };
};
