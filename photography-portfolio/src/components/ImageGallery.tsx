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

  if (!items.length) {
    return <p className="text-secondary">{loading ? 'Cargando fotos...' : 'No hay fotos para mostrar aún.'}</p>;
  }

  return (
    <div className="masonry-grid">
      {items.map(photo => (
        <figure key={photo.id} className="masonry-item">
          <img src={photo.url} alt={photo.originalName} />
        </figure>
      ))}
    </div>
  );
};

export default ImageGallery;
