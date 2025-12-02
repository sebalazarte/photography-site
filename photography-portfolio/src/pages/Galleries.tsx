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
    <div>
      <h2 className="h3 mb-1">Galerías</h2>
      <p className="text-secondary">Explora las colecciones disponibles.</p>

      <div className="row g-4 align-items-start">
        <section className="col-12 col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="h6">Colecciones</h3>
              <ul className="list-group">
                {galleries.map(g => (
                  <li key={g.slug} className="list-group-item d-flex justify-content-between align-items-center">
                    <button
                      onClick={() => setSelectedGalleryId(g.slug)}
                      className={`btn btn-link text-decoration-none text-start flex-grow-1 ${selectedGalleryId === g.slug ? 'fw-semibold' : ''}`}
                    >
                      {g.name}
                      <span className="badge text-bg-light ms-2">{photoCounts[g.slug] ?? 0}</span>
                    </button>
                  </li>
                ))}
                {galleries.length === 0 && <li className="list-group-item text-secondary">No hay galerías publicadas todavía.</li>}
              </ul>
            </div>
          </div>
        </section>

        <section className="col-12 col-md-8">
          <h3 className="h6">Galería seleccionada</h3>
          {!selectedGallery && <p className="text-secondary">Elige una galería para ver sus fotos.</p>}
          {selectedGallery && (
            <div className="card shadow-sm">
              <div className="card-body vstack gap-3">
                <strong>{selectedGallery.name}</strong>
                {galleryLoading && <p className="text-secondary">Cargando fotos...</p>}
                <ImageGallery folder={galleryFolderKey(selectedGallery.slug)} photos={selectedPhotos} />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Galleries;
