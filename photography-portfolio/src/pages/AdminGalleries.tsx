import { Navigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import UploadPhotos from '../components/UploadPhotos';
import { galleryFolderKey } from '../constants';
import { useAuth } from '../context/AuthContext';
import { createGallery, deleteGallery as deleteGalleryApi, fetchGalleries, updateGalleryName, type GalleryDTO } from '../api/galleries';
import { listFolderPhotos } from '../api/photos';
import { useFolderPhotos } from '../hooks/useFolderPhotos';
import GalleryAdminPanel from '../components/GalleryAdminPanel';

const AdminGalleries = () => {
  const { user } = useAuth();
  const [galleries, setGalleries] = useState<GalleryDTO[]>([]);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [creatingGallery, setCreatingGallery] = useState(false);
  const [deletingGallerySlug, setDeletingGallerySlug] = useState<string | null>(null);
  const [renamingSlug, setRenamingSlug] = useState<string | null>(null);
  const folderKey = selectedGalleryId ? galleryFolderKey(selectedGalleryId) : undefined;
  const { photos: selectedPhotos, setPhotos: setSelectedPhotos } = useFolderPhotos(folderKey);

  const refreshCounts = useCallback(async (source: GalleryDTO[]) => {
    const ownerId = user?.id;
    if (!ownerId) {
      setPhotoCounts({});
      return;
    }
    if (!source.length) {
      setPhotoCounts({});
      return;
    }
    const entries = await Promise.all(
      source.map(async (g) => {
        const photos = await listFolderPhotos(galleryFolderKey(g.slug));
        return [g.slug, photos.length] as const;
      })
    );
    setPhotoCounts(Object.fromEntries(entries));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setGalleries([]);
      setSelectedGalleryId(null);
      setPhotoCounts({});
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchGalleries(user.id);
        setGalleries(data);
        setSelectedGalleryId(prev => prev ?? data[0]?.slug ?? null);
        await refreshCounts(data);
      } catch (err) {
        console.error('No se pudieron cargar las galerías', err);
        setPhotoCounts({});
      } finally {
        setLoading(false);
      }
    };
    load().catch(() => {
      /* logged above */
    });
  }, [refreshCounts, user?.id]);

  const selectedGallery = useMemo(() => (
    galleries.find(g => g.slug === selectedGalleryId) || null
  ), [galleries, selectedGalleryId]);

  useEffect(() => {
    if (!selectedGalleryId) return;
    setPhotoCounts(prev => {
      const current = prev[selectedGalleryId];
      const nextCount = selectedPhotos.length;
      if (current === nextCount) {
        return prev;
      }
      return { ...prev, [selectedGalleryId]: nextCount };
    });
  }, [selectedGalleryId, selectedPhotos.length]);

  const addGallery = async () => {
    const name = newGalleryName.trim();
    if (!name) return;
    try {
      setCreatingGallery(true);
      const updated = await createGallery(name);
      setGalleries(updated);
      setNewGalleryName('');
      setSelectedGalleryId(updated[updated.length - 1]?.slug ?? null);
      await refreshCounts(updated);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo crear la galería');
    } finally {
      setCreatingGallery(false);
    }
  };

  const deleteGallery = async (slug: string) => {
    try {
      setDeletingGallerySlug(slug);
      const updated = await deleteGalleryApi(slug);
      setGalleries(updated);
      if (selectedGalleryId === slug) {
        setSelectedGalleryId(updated[0]?.slug ?? null);
        setSelectedPhotos([]);
      }
      await refreshCounts(updated);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo eliminar la galería');
    } finally {
      setDeletingGallerySlug(null);
    }
  };

  const renameGallery = async (slug: string, name: string) => {
    try {
      setRenamingSlug(slug);
      const updated = await updateGalleryName(slug, name);
      setGalleries(updated);
      await refreshCounts(updated);
      return true;
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo renombrar la galería');
      return false;
    } finally {
      setRenamingSlug(null);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className='font-monospace'>
      <h1 className="h4 mb-1">Administrar galerías</h1>
      <p className="text-secondary">Crea, elimina y carga fotos para cada colección.</p>

      <div className="row g-4 align-items-start">
        <GalleryAdminPanel
          galleries={galleries}
          selectedGalleryId={selectedGalleryId}
          onSelectGallery={setSelectedGalleryId}
          photoCounts={photoCounts}
          newGalleryName={newGalleryName}
          onNewGalleryNameChange={setNewGalleryName}
          onAddGallery={addGallery}
          onDeleteGallery={deleteGallery}
          onRenameGallery={renameGallery}
          creatingGallery={creatingGallery}
          deletingGallerySlug={deletingGallerySlug}
          renamingSlug={renamingSlug}
          disabled={loading}
        />

        <section className="col-12 col-md-8">
          {!selectedGallery && <p className="text-secondary">Selecciona una galería para ver y agregar fotos.</p>}
          {selectedGallery && (
                <UploadPhotos
                  folder={galleryFolderKey(selectedGallery.slug)}
                  photos={selectedPhotos}
                  onPhotosChange={(next) => setSelectedPhotos(next)}
                />
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminGalleries;
