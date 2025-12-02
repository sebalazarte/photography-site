import { useEffect, useMemo, useState } from 'react';
import type { StoredPhoto } from '../types/photos';
import './ImageGallery.css';
import { useFolderPhotos } from '../hooks/useFolderPhotos';

interface ImageGalleryProps {
  folder: string;
  photos?: StoredPhoto[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ folder, photos }) => {
  const shouldFetch = !photos;
  const { photos: fetched, loading } = useFolderPhotos(shouldFetch ? folder : undefined);
  const items = photos ?? fetched;
  const [orientations, setOrientations] = useState<Record<string, 'portrait' | 'landscape' | 'square'>>({});

  useEffect(() => {
    setOrientations((prev) => {
      const next: Record<string, 'portrait' | 'landscape' | 'square'> = {};
      items.forEach(photo => {
        if (prev[photo.id]) next[photo.id] = prev[photo.id];
      });
      return next;
    });
  }, [items]);

  const fallbackPattern = useMemo(() => ['portrait', 'landscape', 'square'] as const, []);

  const getOrientation = (photoId: string, index: number) => {
    const saved = orientations[photoId];
    if (saved) return saved;
    const pattern = fallbackPattern[index % fallbackPattern.length];
    return pattern;
  };

  const handleLoad = (photoId: string) => (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget as HTMLImageElement;
    const { naturalWidth, naturalHeight } = img;
    if (!naturalWidth || !naturalHeight) return;
    const ratio = naturalWidth / naturalHeight;
    let orientation: 'portrait' | 'landscape' | 'square';
    if (ratio > 1.25) {
      orientation = 'landscape';
    } else if (ratio < 0.8) {
      orientation = 'portrait';
    } else {
      orientation = 'square';
    }
    setOrientations(prev => (prev[photoId] === orientation ? prev : { ...prev, [photoId]: orientation }));
  };

  if (!items.length) {
    return <p className="text-secondary">{loading ? 'Cargando fotos...' : 'No hay fotos para mostrar aún.'}</p>;
  }

  return (
    <div className="masonry-grid">
      {items.map((photo, index) => {
        const orientation = getOrientation(photo.id, index);
        return (
          <figure key={photo.id} className={`masonry-item ${orientation}`}>
            <img src={photo.url} alt={photo.originalName} onLoad={handleLoad(photo.id)} />
          </figure>
        );
      })}
    </div>
  );
};

export default ImageGallery;
