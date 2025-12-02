import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import UploadPhotos from '../components/UploadPhotos';
import ImageGallery from '../components/ImageGallery';
import { galleryFolderKey } from '../constants';
import { listPhotos, type StoredPhoto } from '../utils/photoStorage';
import { useAuth } from '../context/AuthContext';

type Gallery = {
  id: string;
  name: string;
};

const STORAGE_KEY = 'pp_galleries_v2';

const Galleries: React.FC = () => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<StoredPhoto[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Gallery[];
        setGalleries(parsed.map(g => ({ id: g.id, name: g.name })));
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(galleries));
  }, [galleries]);

  const selectedGallery = useMemo(() => (
    galleries.find(g => g.id === selectedGalleryId) || null
  ), [galleries, selectedGalleryId]);

  useEffect(() => {
    if (!selectedGallery) {
      setSelectedPhotos([]);
      return;
    }
    setSelectedPhotos(listPhotos(galleryFolderKey(selectedGallery.id)));
  }, [selectedGallery]);

  const photosCount = (id: string) => listPhotos(galleryFolderKey(id)).length;

  const addGallery = () => {
    const name = newGalleryName.trim();
    if (!name) return;
    const g: Gallery = { id: crypto.randomUUID(), name };
    setGalleries(prev => [...prev, g]);
    setNewGalleryName('');
  };

  const deleteGallery = (id: string) => {
    setGalleries(prev => prev.filter(g => g.id !== id));
    if (selectedGalleryId === id) setSelectedGalleryId(null);
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
                  <li key={g.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <button
                      onClick={() => setSelectedGalleryId(g.id)}
                      className={`btn btn-link text-decoration-none text-start flex-grow-1 ${selectedGalleryId === g.id ? 'fw-semibold' : ''}`}
                    >
                      {g.name}
                      <span className="badge text-bg-light ms-2">{photosCount(g.id)}</span>
                    </button>
                    <button onClick={() => deleteGallery(g.id)} className="btn btn-sm btn-outline-danger">Eliminar</button>
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
                            <UploadPhotos folder={galleryFolderKey(selectedGallery.id)} onPhotosChange={setSelectedPhotos} />
                )}
                <ImageGallery photos={selectedPhotos} />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Galleries;
