import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import UploadPhotos from '../components/UploadPhotos';
import ImageGallery from '../components/ImageGallery';
import { galleryFolderKey } from '../constants';
import { useAuth } from '../context/AuthContext';
import { createGallery, deleteGallery as deleteGalleryApi, fetchGalleries, type GalleryDTO } from '../api/galleries';
import { useFolderPhotos } from '../hooks/useFolderPhotos';
import { listFolderPhotos } from '../api/photos';

const Galleries: React.FC = () => {
  const [galleries, setGalleries] = useState<GalleryDTO[]>([]);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});
  const { user } = useAuth();
  const folderKey = selectedGalleryId ? galleryFolderKey(selectedGalleryId) : undefined;
  const { photos: selectedPhotos, setPhotos: setSelectedPhotos, loading: galleryLoading } = useFolderPhotos(folderKey);

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

  const refreshCounts = async () => {
    const entries = await Promise.all(
      galleries.map(async g => {
        const photos = await listFolderPhotos(galleryFolderKey(g.slug));
        return [g.slug, photos.length] as const;
      })
    );
    setPhotoCounts(Object.fromEntries(entries));
  };

  const addGallery = async () => {
    const name = newGalleryName.trim();
    if (!name) return;
    try {
      const updated = await createGallery(name);
      setGalleries(updated);
      setNewGalleryName('');
      setSelectedGalleryId(updated[updated.length - 1]?.slug ?? null);
      await refreshCounts();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo crear la galería');
    }
  };

  const deleteGallery = async (slug: string) => {
    try {
      const updated = await deleteGalleryApi(slug);
      setGalleries(updated);
      if (selectedGalleryId === slug) {
        setSelectedGalleryId(updated[0]?.slug ?? null);
        setSelectedPhotos([]);
      }
      await refreshCounts();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo eliminar la galería');
    }
  };

  return (
    <div>
      <h2 className="h3 mb-1">Galerías</h2>
      <p className="text-secondary">Administra nombres de galerías y sus fotos.</p>

      <div className="row g-4 align-items-start">
        <section className="col-12 col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="h6">Crear nueva galería</h3>
              <div className="d-flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Nombre de la galería"
                  value={newGalleryName}
                  onChange={e => setNewGalleryName(e.target.value)}
                  className="form-control"
                />
                <button onClick={addGallery} className="btn btn-primary">Agregar</button>
              </div>

              <h3 className="h6">Todas las galerías</h3>
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
                    <button onClick={() => deleteGallery(g.slug)} className="btn btn-sm btn-outline-danger">Eliminar</button>
                  </li>
                ))}
                {galleries.length === 0 && <li className="list-group-item text-secondary">No hay galerías aún.</li>}
              </ul>
            </div>
          </div>
        </section>

        <section className="col-12 col-md-8">
          <h3 className="h6">Detalle</h3>
          {!selectedGallery && <p className="text-secondary">Selecciona una galería para ver y agregar fotos.</p>}
          {selectedGallery && (
            <div className="card shadow-sm">
              <div className="card-body vstack gap-3">
                <div className="d-flex align-items-center gap-3">
                  <strong>{selectedGallery.name}</strong>
                  {!user && <span className="text-danger small">Debes iniciar sesión para subir fotos.</span>}
                </div>
                {user && (
                  <UploadPhotos
                    folder={galleryFolderKey(selectedGallery.slug)}
                    photos={selectedPhotos}
                    onPhotosChange={(next) => setSelectedPhotos(next)}
                  />
                )}
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
