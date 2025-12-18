import { useEffect, useState } from 'react';
import type { StoredPhoto } from '../../types/photos';
import './ImageGallery.css';
import LightboxModal from './LightboxModal';
import { clearFolderPhotos, deletePhotoFromFolder, updatePhotoOrder } from '../../api/photos';
import { useAuth } from '../../context/AuthContext';
import { HOME_FOLDER } from '../../constants';

interface HomeImageGalleryProps {
  photos?: StoredPhoto[];
  loading?: boolean;
  onPhotosChange?: (photos: StoredPhoto[]) => void;
}

const OriginIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 4l5.5 13 1.5-5 5 1.8L6 4z" fill="currentColor" stroke="none" />
    <path d="M13 12l4 4" />
  </svg>
);

const TargetIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="8" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5.5" />
  </svg>
);

const HomeImageGallery: React.FC<HomeImageGalleryProps> = ({ photos, loading = false, onPhotosChange }) => {
  const galleryItems = photos ?? [];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user } = useAuth();
  const canManage = Boolean(user);
  const [orderingMode, setOrderingMode] = useState(false);
  const [sourcePhotoId, setSourcePhotoId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2000);
    return () => clearTimeout(timer);
  }, [notice]);

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
  };

  const handleSelectTarget = async (targetPhotoId: string) => {
    if (!sourcePhotoId || targetPhotoId === sourcePhotoId || savingOrder) return;
    const orderIds = galleryItems.map(photo => photo.id);
    const fromIndex = orderIds.indexOf(sourcePhotoId);
    const toIndex = orderIds.indexOf(targetPhotoId);
    if (fromIndex === -1 || toIndex === -1) {
      setSourcePhotoId(null);
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
      setSourcePhotoId(null);
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
      setSourcePhotoId(null);
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
          <div className="ms-auto d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={handleClearHome}
              disabled={savingOrder || clearingAll}
            >
              {clearingAll ? 'Limpiando…' : 'Limpiar'}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${orderingMode ? 'btn-outline-primary' : 'btn-primary'}`}
              onClick={() => {
                setOrderingMode(current => {
                  const next = !current;
                  if (!next) {
                    setSourcePhotoId(null);
                  }
                  return next;
                });
              }}
              disabled={savingOrder || clearingAll}
            >
              {orderingMode ? 'Salir de ordenar' : 'Ordenar'}
            </button>
          </div>
          {savingOrder && (
            <div className="w-100">
              <div className="progress" aria-hidden="true">
                <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: '100%' }}></div>
              </div>
              <span className="text-info small d-block mt-1">Guardando nuevo orden…</span>
            </div>
          )}
        </div>
      )}
      <div className="masonry-grid">
        {galleryItems.map((photo, index) => {
          const positionValue = typeof photo.order === 'number' ? photo.order : index;
          const displayPosition = positionValue + 1;
          return (
            <figure key={photo.id} className="masonry-item">
              {canManage && orderingMode && (
                <span className="masonry-item__position" aria-label="Posición actual">
                  {displayPosition}
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
            {canManage && (
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
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-hidden="true"
                >
                  <path
                    d="M5 7h14M10 11v6M14 11v6M7 7l1 12h8l1-12M9 7V5h6v2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
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
            {canManage && orderingMode && sourcePhotoId && (
              <button
                type="button"
                className={`masonry-item__select masonry-item__select--target ${photo.id === sourcePhotoId ? 'is-selected' : ''}`}
                aria-label="Seleccionar destino"
                title={photo.id === sourcePhotoId ? 'Origen seleccionado' : 'Seleccionar como destino'}
                disabled={photo.id === sourcePhotoId || savingOrder}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleSelectTarget(photo.id);
                }}
              >
                <span className="masonry-item__select-icon" aria-hidden="true">
                  {photo.id === sourcePhotoId ? <OriginIcon /> : <TargetIcon />}
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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
