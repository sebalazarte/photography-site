import type React from 'react';
import type { GalleryDTO } from '../../api/galleries';

interface GalleryListProps {
  galleries: GalleryDTO[];
  selectedGalleryId: string | null;
  onSelectGallery: (galleryId: string) => void;
  photoCounts: Record<string, number>;
}

const GalleryList: React.FC<GalleryListProps> = ({
  galleries,
  selectedGalleryId,
  onSelectGallery,
  photoCounts,
}) => {
  if (!galleries.length) {
    return <p className="text-secondary">No hay galerías publicadas todavía.</p>;
  }

  return (
    <ul className="nav gallery-tabs flex-wrap mb-4">
      {galleries.map(gallery => (
        <li key={gallery.slug} className="nav-item">
          <button
            type="button"
            onClick={() => onSelectGallery(gallery.slug)}
            className={`nav-link ${selectedGalleryId === gallery.slug ? 'active' : ''}`}
          >
            {gallery.name}
            <span className="badge rounded-pill ms-2">{photoCounts[gallery.slug] ?? 0}</span>
          </button>
        </li>
      ))}
    </ul>
  );
};

export default GalleryList;
