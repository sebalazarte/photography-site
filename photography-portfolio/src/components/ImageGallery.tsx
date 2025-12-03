import { useCallback, useEffect, useState } from 'react';
import type { StoredPhoto } from '../types/photos';
import './ImageGallery.css';
import { useFolderPhotos } from '../hooks/useFolderPhotos';
import LightboxModal from './LightboxModal';
import { useAuth } from '../context/AuthContext';
import { updatePhotoOrder } from '../api/photos';

interface ImageGalleryProps {
  folder: string;
  photos?: StoredPhoto[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ folder, photos }) => {
  const shouldFetch = !photos;
  const { photos: fetched, loading } = useFolderPhotos(shouldFetch ? folder : undefined);
  const items = photos ?? fetched;
  const { user } = useAuth();
  const canReorder = Boolean(user);
  const [orderedItems, setOrderedItems] = useState<StoredPhoto[]>(items);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    setOrderedItems(prev => {
      if (!prev.length) {
        return items;
      }
      const nextMap = new Map(items.map(photo => [photo.id, photo] as const));
      const prevIds = prev.map(photo => photo.id);
      const nextIds = items.map(photo => photo.id);
      const added = nextIds.some(id => !prevIds.includes(id));
      const removed = prevIds.some(id => !nextMap.has(id));
      if (added || removed || prev.length !== items.length) {
        return items;
      }
      return prev.map(photo => nextMap.get(photo.id) ?? photo);
    });
  }, [items]);

  const galleryItems = canReorder ? orderedItems : items;

  useEffect(() => {
    if (activeIndex !== null && activeIndex >= galleryItems.length) {
      setActiveIndex(galleryItems.length ? 0 : null);
    }
  }, [activeIndex, galleryItems.length]);

  const openModal = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const closeModal = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const showNext = useCallback(() => {
    setActiveIndex(prev => {
      if (prev === null || !galleryItems.length) return prev;
      return (prev + 1) % galleryItems.length;
    });
  }, [galleryItems.length]);

  const showPrev = useCallback(() => {
    setActiveIndex(prev => {
      if (prev === null || !galleryItems.length) return prev;
      return (prev - 1 + galleryItems.length) % galleryItems.length;
    });
  }, [galleryItems.length]);

  const handleDragStart = useCallback((event: React.DragEvent<HTMLElement>, photoId: string) => {
    if (!canReorder || savingOrder) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', photoId);
    setDraggedId(photoId);
  }, [canReorder, savingOrder]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLElement>, photoId: string) => {
    if (!canReorder || !draggedId || draggedId === photoId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dragOverId !== photoId) {
      setDragOverId(photoId);
    }
  }, [canReorder, draggedId, dragOverId]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLElement>, photoId: string) => {
    if (!canReorder) return;
    event.preventDefault();
    if (dragOverId === photoId) {
      setDragOverId(null);
    }
  }, [canReorder, dragOverId]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLElement>, targetId: string) => {
    if (!canReorder) return;
    event.preventDefault();
    event.stopPropagation();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const current = [...orderedItems];
    const fromIndex = current.findIndex(photo => photo.id === draggedId);
    const toIndex = current.findIndex(photo => photo.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const reordered = [...current];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setOrderedItems(reordered);

    try {
      setSavingOrder(true);
      const refreshed = await updatePhotoOrder(folder, reordered.map(photo => photo.id));
      setOrderedItems(refreshed);
    } catch (error) {
      console.error('No se pudo guardar el nuevo orden de fotos', error);
      setOrderedItems(current);
    } finally {
      setSavingOrder(false);
      setDraggedId(null);
      setDragOverId(null);
    }
  }, [canReorder, draggedId, folder, orderedItems]);

  if (!galleryItems.length) {
    return <p className="text-secondary">{loading ? 'Cargando fotos...' : 'No hay fotos para mostrar aún.'}</p>;
  }

  return (
    <div>
      {canReorder && (
        <p className="text-secondary small mb-2">Arrastrá y soltá las fotos para ajustar el orden.</p>
      )}
      {savingOrder && canReorder && (
        <p className="text-info small mb-3">Guardando nuevo orden…</p>
      )}
      <div className="masonry-grid">
        {galleryItems.map((photo, index) => {
        const isDragging = draggedId === photo.id;
        const isOver = dragOverId === photo.id;
        const figureClass = `masonry-item${canReorder ? ' draggable' : ''}${isDragging ? ' is-dragging' : ''}${isOver ? ' drag-over' : ''}`;

        const dragProps = canReorder ? {
          draggable: true,
          onDragStart: (event: React.DragEvent<HTMLElement>) => handleDragStart(event, photo.id),
          onDragOver: (event: React.DragEvent<HTMLElement>) => handleDragOver(event, photo.id),
          onDragLeave: (event: React.DragEvent<HTMLElement>) => handleDragLeave(event, photo.id),
          onDrop: (event: React.DragEvent<HTMLElement>) => void handleDrop(event, photo.id),
          onDragEnd: handleDragEnd,
        } : {};

        return (
          <figure
            key={photo.id}
            className={figureClass}
            {...dragProps}
          >
            <button
              type="button"
              className="masonry-item__trigger"
              onClick={() => openModal(index)}
              disabled={savingOrder}
            >
              <img src={photo.url} alt={photo.originalName} />
            </button>
          </figure>
        );
      })}
      </div>
      {activeIndex !== null && galleryItems[activeIndex] && (
        <LightboxModal
          photos={galleryItems}
          index={activeIndex}
          onClose={closeModal}
          onPrev={showPrev}
          onNext={showNext}
        />
      )}
    </div>
  );
};

export default ImageGallery;
