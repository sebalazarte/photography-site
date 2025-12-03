import type React from 'react';
import { useState } from 'react';
import type { GalleryDTO } from '../api/galleries';

const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const EditIcon = () => (
  <svg {...iconProps} aria-hidden="true">
    <path d="M4 17v3h3l11-11-3-3L4 17z" />
    <path d="M13 6l3 3" />
  </svg>
);

const TrashIcon = () => (
  <svg {...iconProps} aria-hidden="true">
    <path d="M5 7h14" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M7 7l1 12h8l1-12" />
    <path d="M9 7V5h6v2" />
  </svg>
);

const SaveIcon = () => (
  <svg {...iconProps} aria-hidden="true">
    <polyline points="5 12.5 9.5 17 19 7.5" />
  </svg>
);

const CloseIcon = () => (
  <svg {...iconProps} aria-hidden="true">
    <path d="M6 6l12 12" />
    <path d="M6 18L18 6" />
  </svg>
);

const PendingIcon = () => (
  <svg {...iconProps} aria-hidden="true">
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l2.5 2.5" />
  </svg>
);

interface GalleryAdminPanelProps {
  galleries: GalleryDTO[];
  selectedGalleryId: string | null;
  onSelectGallery: (slug: string) => void;
  photoCounts: Record<string, number>;
  newGalleryName: string;
  onNewGalleryNameChange: (value: string) => void;
  onAddGallery: () => void;
  onDeleteGallery: (slug: string) => void;
  onRenameGallery: (slug: string, name: string) => Promise<boolean>;
  creatingGallery: boolean;
  deletingGallerySlug: string | null;
  renamingSlug: string | null;
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
  onRenameGallery,
  creatingGallery,
  deletingGallerySlug,
  renamingSlug,
  disabled = false,
}) => {
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newGalleryName.trim() || creatingGallery || disabled) return;
    onAddGallery();
  };

  const handleSelect = (slug: string) => {
    if (disabled) return;
    onSelectGallery(slug);
  };

  const handleDelete = (gallery: GalleryDTO) => {
    if (disabled || renamingSlug) return;
    const confirmed = window.confirm(`¿Eliminar la galería "${gallery.name}" y todas sus fotos? Esta acción no se puede deshacer.`);
    if (confirmed) {
      onDeleteGallery(gallery.slug);
    }
  };

  const startEditing = (gallery: GalleryDTO) => {
    if (disabled || renamingSlug) return;
    setEditingSlug(gallery.slug);
    setEditingName(gallery.name);
  };

  const cancelEditing = () => {
    if (renamingSlug) return;
    setEditingSlug(null);
    setEditingName('');
  };

  const handleRenameSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingSlug) return;
    const nextName = editingName.trim();
    if (!nextName || renamingSlug) return;
    const success = await onRenameGallery(editingSlug, nextName);
    if (success) {
      setEditingSlug(null);
      setEditingName('');
    }
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
                const isRenaming = renamingSlug === gallery.slug;
                const isEditing = editingSlug === gallery.slug;
                const count = photoCounts[gallery.slug] ?? 0;
                return (
                  <li key={gallery.slug} className="list-group-item">
                    {isEditing ? (
                      <form
                        className="d-flex flex-column flex-sm-row gap-2 align-items-stretch"
                        onSubmit={handleRenameSubmit}
                      >
                        <input
                          className="form-control"
                          value={editingName}
                          onChange={event => setEditingName(event.target.value)}
                          disabled={isRenaming}
                        />
                        <div className="d-flex gap-2">
                          <button
                            type="submit"
                            className="btn btn-sm btn-primary icon-button"
                            aria-label="Guardar nombre de galería"
                            disabled={isRenaming || !editingName.trim() || editingName.trim() === gallery.name}
                          >
                              {isRenaming ? <PendingIcon /> : <SaveIcon />}
                          </button>
                          <button
                            type="button"
                              className="btn btn-sm btn-outline-secondary icon-button"
                            onClick={cancelEditing}
                              aria-label="Cancelar edición de galería"
                            disabled={isRenaming}
                          >
                              <CloseIcon />
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="d-flex justify-content-between align-items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelect(gallery.slug)}
                          className={`btn btn-link text-decoration-none text-start flex-grow-1 ${isSelected ? 'fw-semibold' : ''}`}
                          disabled={disabled}
                        >
                          {gallery.name}
                          <span className="badge text-bg-light ms-2">({count})</span>
                        </button>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary icon-button"
                            onClick={() => startEditing(gallery)}
                            aria-label="Renombrar galería"
                            disabled={disabled || Boolean(renamingSlug)}
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(gallery)}
                              className="btn btn-sm btn-outline-danger icon-button"
                            aria-label="Eliminar galería"
                            disabled={disabled || isDeleting || Boolean(renamingSlug)}
                          >
                              {isDeleting ? <PendingIcon /> : <TrashIcon />}
                          </button>
                        </div>
                      </div>
                    )}
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
