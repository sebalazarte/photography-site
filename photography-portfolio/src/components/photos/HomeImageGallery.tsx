import { FormEvent, useEffect, useState } from 'react';
import type { StoredPhoto } from '../../types/photos';
import './ImageGallery.css';
import LightboxModal from './LightboxModal';
import { assignGroupToPhotos, clearFolderPhotos, deletePhotoFromFolder, updatePhotoOrder } from '../../api/photos';
import { useAuth } from '../../context/AuthContext';
import { HOME_FOLDER } from '../../constants';
import { AssignIcon, BroomIcon, ErrorIcon, OriginIcon, ReorderIcon, SuccessIcon, TargetIcon, TrashIcon } from '../../types/icons';

interface HomeImageGalleryProps {
  photos?: StoredPhoto[];
  loading?: boolean;
  onPhotosChange?: (photos: StoredPhoto[]) => void;
}

type GroupKey = number | string | null;

const normalizeGroup = (group?: StoredPhoto['group'] | string | null): GroupKey => {
  if (typeof group === 'number' && Number.isFinite(group)) {
    return group;
  }
  if (typeof group === 'string') {
    const trimmed = group.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : trimmed;
  }
  return null;
};

const HomeImageGallery: React.FC<HomeImageGalleryProps> = ({ photos, loading = false, onPhotosChange }) => {
  const galleryItems = photos ?? [];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user } = useAuth();
  const canManage = Boolean(user);
  const [orderingMode, setOrderingMode] = useState(false);
  const [sourcePhotoId, setSourcePhotoId] = useState<string | null>(null);
  const [sourceGroup, setSourceGroup] = useState<GroupKey>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [assignGroupMode, setAssignGroupMode] = useState(false);
  const [assignGroupValue, setAssignGroupValue] = useState('');
  const [assignSelection, setAssignSelection] = useState<Set<string>>(new Set());
  const [assigningGroup, setAssigningGroup] = useState(false);

  const resetOrderingSelection = () => {
    setSourcePhotoId(null);
    setSourceGroup(null);
  };

  const resetAssignState = () => {
    setAssignSelection(new Set());
    setAssignGroupValue('');
  };

  const handleToggleAssignMode = () => {
    setAssignGroupMode(current => {
      const next = !current;
      if (next) {
        setOrderingMode(false);
        resetOrderingSelection();
      } else {
        resetAssignState();
      }
      return next;
    });
  };

  const handleAssignSelectionToggle = (photoId: string) => {
    if (!assignGroupMode || assigningGroup) return;
    setAssignSelection(previous => {
      const next = new Set(previous);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const handleAssignGroupSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    const trimmedValue = assignGroupValue.trim();
    if (!assignGroupMode || !assignSelection.size || !trimmedValue || assigningGroup) {
      return;
    }
    const selection = Array.from(assignSelection);
    try {
      setAssigningGroup(true);
      const updated = await assignGroupToPhotos(HOME_FOLDER, selection, trimmedValue);
      onPhotosChange?.(updated);
      setNotice({ type: 'success', message: `Grupo ${trimmedValue} asignado.` });
      resetAssignState();
      setAssignGroupMode(false);
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo asignar el grupo',
      });
    } finally {
      setAssigningGroup(false);
    }
  };

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!sourcePhotoId) return;
    const current = galleryItems.find(photo => photo.id === sourcePhotoId);
    if (!current) {
      setSourcePhotoId(null);
      setSourceGroup(null);
      return;
    }
    const normalized = normalizeGroup(current.group);
    if (normalized !== sourceGroup) {
      setSourceGroup(normalized);
    }
  }, [galleryItems, sourcePhotoId, sourceGroup]);

  useEffect(() => {
    if (!assignGroupMode || !assignSelection.size) return;
    const existing = new Set(galleryItems.map(photo => photo.id));
    const filtered = Array.from(assignSelection).filter(id => existing.has(id));
    if (filtered.length !== assignSelection.size) {
      setAssignSelection(new Set(filtered));
    }
  }, [assignGroupMode, assignSelection, galleryItems]);

  const handleDeletePhoto = async (photo: StoredPhoto) => {
    if (!canManage || deletingId === photo.id || clearingAll) return;
    const confirmed = window.confirm('¿Eliminar esta foto destacada? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    try {
      setDeletingId(photo.id);
      const updated = await deletePhotoFromFolder(HOME_FOLDER, photo.id);
      onPhotosChange?.(updated);
      setNotice({ type: 'success', message: 'Foto eliminada del inicio.' });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo eliminar la foto',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectSource = (photoId: string) => {
    if (savingOrder) return;
    setSourcePhotoId(photoId);
    const selected = galleryItems.find(photo => photo.id === photoId);
    setSourceGroup(normalizeGroup(selected?.group));
  };

  const handleSelectTarget = async (targetPhotoId: string) => {
    if (!sourcePhotoId || targetPhotoId === sourcePhotoId || savingOrder) return;
    const orderIds = galleryItems.map(photo => photo.id);
    const fromIndex = orderIds.indexOf(sourcePhotoId);
    const toIndex = orderIds.indexOf(targetPhotoId);
    if (fromIndex === -1 || toIndex === -1) {
      setSourcePhotoId(null);
      setSourceGroup(null);
      return;
    }

    const fromPhoto = galleryItems[fromIndex];
    const toPhoto = galleryItems[toIndex];
    const fromGroup = normalizeGroup(fromPhoto?.group);
    const toGroup = normalizeGroup(toPhoto?.group);
    if (fromGroup !== toGroup) {
      setNotice({
        type: 'error',
        message: 'Solo puedes reordenar dentro del mismo grupo.',
      });
      setSourcePhotoId(null);
      setSourceGroup(null);
      return;
    }

    const nextOrder = [...orderIds];
    const [moved] = nextOrder.splice(fromIndex, 1);
    nextOrder.splice(toIndex, 0, moved);

    try {
      setSavingOrder(true);
      const updated = await updatePhotoOrder(HOME_FOLDER, nextOrder);
      onPhotosChange?.(updated);
      setNotice({ type: 'success', message: 'Orden actualizado.' });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo actualizar el orden',
      });
    } finally {
      setSavingOrder(false);
      resetOrderingSelection();
    }
  };

  const handleClearHome = async () => {
    if (!canManage || clearingAll) return;
    const confirmed = window.confirm('¿Eliminar todas las fotos destacadas? Esta acción no se puede deshacer.');
    if (!confirmed) {
      return;
    }

    try {
      setClearingAll(true);
      const updated = await clearFolderPhotos(HOME_FOLDER);
      onPhotosChange?.(updated);
      setOrderingMode(false);
      resetOrderingSelection();
      setAssignGroupMode(false);
      resetAssignState();
      setNotice({ type: 'success', message: 'Galería de inicio vaciada.' });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudieron eliminar todas las fotos',
      });
    } finally {
      setClearingAll(false);
    }
  };

  if (!galleryItems.length) {
    return (
      <p className="text-secondary">
        {loading ? 'Cargando galería…' : 'No hay fotos destacadas por el momento.'}
      </p>
    );
  }

  return (
    <div className="home-gallery">
      {canManage && (
        <div className="home-gallery__controls d-flex flex-wrap align-items-center gap-2 mb-3">
          {orderingMode && (
            <span className="text-secondary small">
              {sourcePhotoId ? 'Selecciona la foto destino.' : 'Selecciona la foto origen.'}
            </span>
          )}
          {assignGroupMode && (
            <span className="text-secondary small">
              {assignSelection.size
                ? `${assignSelection.size} seleccionada${assignSelection.size > 1 ? 's' : ''}. Escribe el grupo y confirma.`
                : 'Selecciona las fotos para asignarles un grupo.'}
            </span>
          )}
          <div className="ms-auto d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={handleClearHome}
              disabled={savingOrder || clearingAll || assigningGroup}
            >
              <span className="d-inline-flex align-items-center gap-1">
                <BroomIcon aria-hidden="true" width={14} height={14} />
                {clearingAll ? 'Limpiando…' : 'Limpiar'}
              </span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${assignGroupMode ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={handleToggleAssignMode}
              disabled={clearingAll || savingOrder || assigningGroup}
            >
              <span className="d-inline-flex align-items-center gap-1">
                <AssignIcon />
                {assignGroupMode ? 'Salir de asignar' : 'Asignar grupo'}
              </span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${orderingMode ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => {
                setOrderingMode(current => {
                  const next = !current;
                  if (next) {
                    setAssignGroupMode(false);
                    resetAssignState();
                  } else {
                    resetOrderingSelection();
                  }
                  return next;
                });
              }}
              disabled={savingOrder || clearingAll || assigningGroup}
            >
              <span className="d-inline-flex align-items-center gap-1">
                <ReorderIcon aria-hidden="true" width={14} height={14} />
                {orderingMode ? 'Salir de ordenar' : 'Ordenar'}
              </span>
            </button>
          </div>
          {assignGroupMode && (
            <form className="w-100 d-flex flex-wrap align-items-center gap-2 mt-2" onSubmit={handleAssignGroupSubmit}>
              <div className="input-group input-group-sm w-auto">
                <span className="input-group-text" id="assign-group-label">Grupo</span>
                <input
                  id="assign-group-input"
                  type="number"
                  inputMode="numeric"
                  className="form-control"
                  aria-describedby="assign-group-label assign-group-help"
                  value={assignGroupValue}
                  onChange={(event) => setAssignGroupValue(event.target.value)}
                  placeholder="Ej. 1"
                  disabled={assigningGroup}
                  min={0}
                />
              </div>
              <span className="text-secondary small" id="assign-group-help">
                {assignSelection.size
                  ? `${assignSelection.size} seleccionada${assignSelection.size > 1 ? 's' : ''}`
                  : 'Toca las fotos para seleccionarlas'}
              </span>
              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-sm btn-primary"
                  disabled={assigningGroup || !assignGroupValue.trim() || !assignSelection.size}
                >
                  {assigningGroup ? 'Guardando…' : 'Aplicar'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={handleToggleAssignMode}
                  disabled={assigningGroup}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
          {savingOrder && (
            <div className="w-100">
              <div className="progress" aria-hidden="true">
                <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: '100%' }}></div>
              </div>
              <span className="text-info small d-block mt-1">Guardando nuevo orden…</span>
            </div>
          )}
          {assigningGroup && (
            <div className="w-100">
              <div className="progress" aria-hidden="true">
                <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: '100%' }}></div>
              </div>
              <span className="text-info small d-block mt-1">Asignando grupo…</span>
            </div>
          )}
        </div>
      )}
      <div className="masonry-grid">
        {galleryItems.map((photo, index) => {
          const positionValue = typeof photo.order === 'number' ? photo.order : index;
          const displayPosition = positionValue + 1;
          const photoGroup = normalizeGroup(photo.group);
          const groupLabel = photoGroup === null ? 'Sin grupo' : `G: ${photoGroup}`;
          const isSourcePhoto = sourcePhotoId === photo.id;
          const matchesSourceGroup = sourcePhotoId ? photoGroup === sourceGroup : true;
          const targetDisabled = isSourcePhoto || savingOrder;
          const targetTitle = isSourcePhoto
            ? 'Origen seleccionado'
            : 'Seleccionar como destino';
          const shouldShowTargetButton = Boolean(sourcePhotoId && (matchesSourceGroup || isSourcePhoto));
          const isAssignSelected = assignSelection.has(photo.id);
          const assignButtonTitle = isAssignSelected ? 'Quitar de la selección' : 'Seleccionar para asignar grupo';
          const showDeleteButton = canManage && !orderingMode && !assignGroupMode;
          return (
            <figure key={photo.id} className="masonry-item">
              {canManage && (orderingMode || assignGroupMode) && (
                <span className="masonry-item__position" aria-label="Grupo y posición actual">
                  <span className="masonry-item__position-label">{groupLabel}</span>
                  <span className="masonry-item__position-meta">P: {displayPosition}</span>
                </span>
              )}
            <button
              type="button"
              className="masonry-item__trigger"
              onClick={() => setActiveIndex(index)}
            >
              <img
                src={photo.url}
                alt={photo.originalName}
                loading={index < 4 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </button>
            {showDeleteButton && (
              <button
                type="button"
                className="masonry-item__delete"
                aria-label="Eliminar foto"
                title="Eliminar foto"
                disabled={deletingId === photo.id}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void handleDeletePhoto(photo);
                }}
              >
                <TrashIcon aria-hidden="true" />
              </button>
            )}
            {canManage && orderingMode && !sourcePhotoId && (
              <button
                type="button"
                className="masonry-item__select masonry-item__select--origin"
                aria-label="Seleccionar como origen"
                title="Seleccionar como origen"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleSelectSource(photo.id);
                }}
              >
                <span className="masonry-item__select-icon" aria-hidden="true">
                  <OriginIcon />
                </span>
              </button>
            )}
            {canManage && orderingMode && shouldShowTargetButton && (
              <button
                type="button"
                className={`masonry-item__select masonry-item__select--target ${isSourcePhoto ? 'is-selected' : ''}`}
                aria-label="Seleccionar destino"
                title={targetTitle}
                disabled={targetDisabled}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleSelectTarget(photo.id);
                }}
              >
                <span className="masonry-item__select-icon" aria-hidden="true">
                  {isSourcePhoto ? <OriginIcon /> : <TargetIcon />}
                </span>
              </button>
            )}
            {canManage && assignGroupMode && (
              <button
                type="button"
                className={`masonry-item__select masonry-item__select--assign ${isAssignSelected ? 'is-selected' : ''}`}
                aria-label={assignButtonTitle}
                title={assignButtonTitle}
                disabled={assigningGroup}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleAssignSelectionToggle(photo.id);
                }}
              >
                <span className="masonry-item__select-icon" aria-hidden="true">
                  <AssignIcon />
                </span>
              </button>
            )}
          </figure>
          );
        })}
      </div>

      {activeIndex !== null && galleryItems[activeIndex] && (
        <LightboxModal
          photos={galleryItems}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onPrev={() => setActiveIndex(prev => (prev === null ? prev : (prev - 1 + galleryItems.length) % galleryItems.length))}
          onNext={() => setActiveIndex(prev => (prev === null ? prev : (prev + 1) % galleryItems.length))}
        />
      )}
      {notice && (
        <div className={`gallery-toast gallery-toast--${notice.type} toast align-items-center text-white border-0 show`} role="status">
          <div className="d-flex align-items-center">
            <span className="gallery-toast__icon" aria-hidden="true">
              {notice.type === 'success' ? (
                <SuccessIcon aria-hidden="true" />
              ) : (
                <ErrorIcon aria-hidden="true" />
              )}
            </span>
            <div className="toast-body ps-2 pe-3">{notice.message}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeImageGallery;
