import type { StoredPhoto } from '../utils/photoStorage';
import './ImageGallery.css';

interface ImageGalleryProps {
  photos: StoredPhoto[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ photos }) => {
  if (!photos.length) {
    return <p className="text-secondary">No hay fotos para mostrar aún.</p>;
  }

  return (
    <div className="masonry-grid">
      {photos.map(photo => (
        <figure key={photo.id} className="masonry-item">
          <img src={photo.url} alt={photo.name} />
        </figure>
      ))}
    </div>
  );
};

export default ImageGallery;
