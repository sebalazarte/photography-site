import type React from 'react';
import type { GalleryDTO } from '../api/galleries';

interface GalleryAdminPanelProps {
  galleries: GalleryDTO[];
  selectedGalleryId: string | null;
  onSelectGallery: (slug: string) => void;
  photoCounts: Record<string, number>;
  newGalleryName: string;
  onNewGalleryNameChange: (value: string) => void;
  onAddGallery: () => void;
  onDeleteGallery: (slug: string) => void;
  creatingGallery: boolean;
  deletingGallerySlug: string | null;
  disabled?: boolean;
}

const GalleryAdminPanel: React.FC<GalleryAdminPanelProps> = ({
  galleries,
  selectedGalleryId,
  onSelectGallery,
  photoCounts,
  newGalleryName,
  onNewGalleryNameChange,
  onAddGallery,
  onDeleteGallery,
  creatingGallery,
  deletingGallerySlug,
  disabled = false,
}) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newGalleryName.trim() || creatingGallery || disabled) return;
    onAddGallery();
  };

  const handleSelect = (slug: string) => {
    if (disabled) return;
    onSelectGallery(slug);
  };

  return (
    <section className="col-12 col-md-4">
      <div className="card shadow-sm">
        <div className="card-body">
          <h3 className="h6">Nueva galería</h3>
          <form className="d-flex gap-2 mb-3" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Nombre de la galería"
              value={newGalleryName}
              onChange={event => onNewGalleryNameChange(event.target.value)}
              className="form-control"
              disabled={disabled || creatingGallery}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={disabled || creatingGallery || !newGalleryName.trim()}
            >
              {creatingGallery ? 'Agregando…' : 'Agregar'}
            </button>
          </form>

          <h3 className="h6">Existentes</h3>
          {disabled && galleries.length === 0 ? (
            <p className="text-secondary mb-0">Cargando…</p>
          ) : (
            <ul className="list-group">
              {galleries.map(gallery => {
                const isSelected = selectedGalleryId === gallery.slug;
                const isDeleting = deletingGallerySlug === gallery.slug;
                const count = photoCounts[gallery.slug] ?? 0;
                return (
                  <li key={gallery.slug} className="list-group-item d-flex justify-content-between align-items-center">
                    <button
                      type="button"
                      onClick={() => handleSelect(gallery.slug)}
                      className={`btn btn-link text-decoration-none text-start flex-grow-1 ${isSelected ? 'fw-semibold' : ''}`}
                      disabled={disabled}
                    >
                      {gallery.name}
                      <span className="badge text-bg-light ms-2">{count}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteGallery(gallery.slug)}
                      className="btn btn-sm btn-outline-danger"
                      disabled={disabled || isDeleting}
                    >
                      {isDeleting ? 'Eliminando…' : 'Eliminar'}
                    </button>
                  </li>
                );
              })}
              {galleries.length === 0 && (
                <li className="list-group-item text-secondary">No hay galerías aún.</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default GalleryAdminPanel;
