import { useEffect, useMemo, useState } from 'react';
import type React from 'react';

type Photo = {
  id: string;
  name: string;
  url: string;
};

type Gallery = {
  id: string;
  name: string;
  photos: Photo[];
};

const STORAGE_KEY = 'pp_galleries_v1';

const Galleries: React.FC = () => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setGalleries(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(galleries));
  }, [galleries]);

  const selectedGallery = useMemo(() => (
    galleries.find(g => g.id === selectedGalleryId) || null
  ), [galleries, selectedGalleryId]);

  const addGallery = () => {
    const name = newGalleryName.trim();
    if (!name) return;
    const g: Gallery = { id: crypto.randomUUID(), name, photos: [] };
    setGalleries(prev => [...prev, g]);
    setNewGalleryName('');
  };

  const deleteGallery = (id: string) => {
    setGalleries(prev => prev.filter(g => g.id !== id));
    if (selectedGalleryId === id) setSelectedGalleryId(null);
  };

  const handleAddPhotos = (files: FileList | null) => {
    if (!files || !selectedGallery) return;
    const readers: Promise<Photo>[] = Array.from(files).map(file => new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve({ id: crypto.randomUUID(), name: file.name, url: r.result as string });
      r.readAsDataURL(file);
    }));
    Promise.all(readers).then(newPhotos => {
      setGalleries(prev => prev.map(g => g.id === selectedGallery.id ? { ...g, photos: [...g.photos, ...newPhotos] } : g));
    });
  };

  const removePhoto = (pid: string) => {
    if (!selectedGallery) return;
    setGalleries(prev => prev.map(g => g.id === selectedGallery.id ? { ...g, photos: g.photos.filter(p => p.id !== pid) } : g));
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
                      {g.name} ({g.photos.length})
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
              <div className="card-body">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <strong>{selectedGallery.name}</strong>
                  <label>
                    <input type="file" multiple accept="image/*" onChange={e => handleAddPhotos(e.target.files)} style={{ display: 'none' }} />
                    <span className="btn btn-outline-secondary">Agregar fotos</span>
                  </label>
                </div>

                <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
                  {selectedGallery.photos.map(p => (
                    <div key={p.id} className="col">
                      <div className="photo-item card h-100">
                        <img src={p.url} alt={p.name} className="card-img-top" />
                        <div className="photo-info card-body d-flex justify-content-between align-items-center">
                          <span className="photo-name" title={p.name}>{p.name}</span>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => removePhoto(p.id)}>Eliminar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedGallery.photos.length === 0 && (
                    <div className="text-secondary">Aún no hay fotos en esta galería.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Galleries;
