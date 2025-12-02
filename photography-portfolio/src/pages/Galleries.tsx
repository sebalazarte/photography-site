import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import ImageGallery from '../components/ImageGallery';
import { galleryFolderKey } from '../constants';
import { fetchGalleries, type GalleryDTO } from '../api/galleries';
import { useFolderPhotos } from '../hooks/useFolderPhotos';
import { listFolderPhotos } from '../api/photos';

const Galleries: React.FC = () => {
  const [galleries, setGalleries] = useState<GalleryDTO[]>([]);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});
  const folderKey = selectedGalleryId ? galleryFolderKey(selectedGalleryId) : undefined;
  const { photos: selectedPhotos, loading: galleryLoading } = useFolderPhotos(folderKey);

  useEffect(() => {
    const load = async () => {
      const data = await fetchGalleries();
      setGalleries(data);
      if (data.length && !selectedGalleryId) {
        setSelectedGalleryId(data[0].slug);
      }
      const entries = await Promise.all(
        data.map(async (g) => {
          const photos = await listFolderPhotos(galleryFolderKey(g.slug));
          return [g.slug, photos.length] as const;
        })
      );
      setPhotoCounts(Object.fromEntries(entries));
    };
    load().catch((err) => console.error('No se pudieron cargar las galerías', err));
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

      {galleries.length > 0 ? (
        <ul className="nav gallery-tabs flex-wrap mb-4">
          {galleries.map(g => (
            <li key={g.slug} className="nav-item">
              <button
                type="button"
                onClick={() => setSelectedGalleryId(g.slug)}
                className={`nav-link ${selectedGalleryId === g.slug ? 'active' : ''}`}
              >
                {g.name}
                <span className="badge rounded-pill ms-2">{photoCounts[g.slug] ?? 0}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-secondary">No hay galerías publicadas todavía.</p>
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
