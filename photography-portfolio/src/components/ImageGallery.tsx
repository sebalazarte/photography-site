import { useCallback, useEffect, useState } from 'react';
import type { StoredPhoto } from '../types/photos';
import './ImageGallery.css';
import { useFolderPhotos } from '../hooks/useFolderPhotos';
import LightboxModal from './LightboxModal';

interface ImageGalleryProps {
  folder: string;
  photos?: StoredPhoto[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ folder, photos }) => {
  const shouldFetch = !photos;
  const { photos: fetched, loading } = useFolderPhotos(shouldFetch ? folder : undefined);
  const items = photos ?? fetched;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex !== null && activeIndex >= items.length) {
      setActiveIndex(items.length ? 0 : null);
    }
  }, [activeIndex, items.length]);

  const openModal = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const closeModal = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const showNext = useCallback(() => {
    setActiveIndex(prev => {
      if (prev === null || !items.length) return prev;
      return (prev + 1) % items.length;
    });
  }, [items.length]);

  const showPrev = useCallback(() => {
    setActiveIndex(prev => {
      if (prev === null || !items.length) return prev;
      return (prev - 1 + items.length) % items.length;
    });
  }, [items.length]);

  if (!items.length) {
    return <p className="text-secondary">{loading ? 'Cargando fotos...' : 'No hay fotos para mostrar aún.'}</p>;
  }

  return (
    <div className="masonry-grid">
      {items.map((photo, index) => (
        <figure key={photo.id} className="masonry-item">
          <button type="button" className="masonry-item__trigger" onClick={() => openModal(index)}>
            <img src={photo.url} alt={photo.originalName} />
          </button>
        </figure>
      ))}
      {activeIndex !== null && items[activeIndex] && (
        <LightboxModal
          photos={items}
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
