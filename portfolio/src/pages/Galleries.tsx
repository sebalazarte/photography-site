import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import ImageGallery from '../components/photos/ImageGallery';
import GalleryList from '../components/photos/GalleryList';
import { galleryFolderKey } from '../constants';
import { fetchGalleries, type GalleryDTO } from '../api/galleries';
import { useFolderPhotos } from '../hooks/useFolderPhotos';
import { listFolderPhotos } from '../api/photos';

const Galleries: React.FC = () => {
  const [galleries, setGalleries] = useState<GalleryDTO[]>([]);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const folderKey = selectedGalleryId ? galleryFolderKey(selectedGalleryId) : undefined;
  const { photos: selectedPhotos, loading: galleryLoading } = useFolderPhotos(folderKey);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchGalleries();
        if (!active) return;
        setGalleries(data);
        setSelectedGalleryId(prev => prev ?? data[0]?.slug ?? null);
        const entries = await Promise.all(
          data.map(async (g) => {
            const photos = await listFolderPhotos(galleryFolderKey(g.slug));
            return [g.slug, photos.length] as const;
          })
        );
        if (!active) return;
        setPhotoCounts(Object.fromEntries(entries));
      } catch (err) {
        console.error('No se pudieron cargar las galerías', err);
        if (active) {
          setGalleries([]);
          setPhotoCounts({});
          setSelectedGalleryId(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load().catch(() => {
      // el error se maneja en load
    });
    return () => {
      active = false;
    };
  }, []);

  const selectedGallery = useMemo(() => (
    galleries.find(g => g.slug === selectedGalleryId) || null
  ), [galleries, selectedGalleryId]);

  return (
    <div className="gallery-page">
      <header className="mb-4">
        <h2 className="h3 mb-1">Galerías</h2>
        <p className="text-secondary">Explora las colecciones disponibles.</p>
      </header>

      {loading && <p className="text-secondary">Cargando galerías...</p>}

      {!loading && (
        <GalleryList
          galleries={galleries}
          selectedGalleryId={selectedGalleryId}
          onSelectGallery={setSelectedGalleryId}
          photoCounts={photoCounts}
        />
      )}

      {!selectedGallery && galleries.length > 0 && (
        <p className="text-secondary">Elige una galería para ver sus fotos.</p>
      )}

      {selectedGallery && (
        <section>
          {galleryLoading && <p className="text-secondary">Cargando fotos...</p>}
          <ImageGallery folder={galleryFolderKey(selectedGallery.slug)} photos={selectedPhotos} />
        </section>
      )}
    </div>
  );
};

export default Galleries;
