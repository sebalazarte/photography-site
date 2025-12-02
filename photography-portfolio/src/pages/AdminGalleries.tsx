import { Navigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import UploadPhotos from '../components/UploadPhotos';
import { galleryFolderKey } from '../constants';
import { useAuth } from '../context/AuthContext';
import { createGallery, deleteGallery as deleteGalleryApi, fetchGalleries, type GalleryDTO } from '../api/galleries';
import { listFolderPhotos } from '../api/photos';
import { useFolderPhotos } from '../hooks/useFolderPhotos';

const AdminGalleries = () => {
  const { user } = useAuth();
  const [galleries, setGalleries] = useState<GalleryDTO[]>([]);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});
  const folderKey = selectedGalleryId ? galleryFolderKey(selectedGalleryId) : undefined;
  const { photos: selectedPhotos, setPhotos: setSelectedPhotos } = useFolderPhotos(folderKey);

  useEffect(() => {
    const load = async () => {
      const data = await fetchGalleries();
      setGalleries(data);
      setSelectedGalleryId(prev => prev ?? data[0]?.slug ?? null);
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className='font-monospace'>
      <h1 className="h4 mb-1">Administrar galerías</h1>
      <p className="text-secondary">Crea, elimina y carga fotos para cada colección.</p>

      <div className="row g-4 align-items-start">
        <section className="col-12 col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="h6">Nueva galería</h3>
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

              <h3 className="h6">Existentes</h3>
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
