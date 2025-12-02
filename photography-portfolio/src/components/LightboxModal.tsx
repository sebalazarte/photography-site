import { useEffect } from 'react';
import type { StoredPhoto } from '../types/photos';
import './ImageGallery.css';

interface LightboxModalProps {
  photos: StoredPhoto[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const LightboxModal: React.FC<LightboxModalProps> = ({ photos, index, onClose, onPrev, onNext }) => {
  const current = photos[index];

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onPrev();
      if (event.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext]);

  if (!current) return null;

  return (
    <div className="lightbox-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="lightbox-content" onClick={event => event.stopPropagation()}>
        <button type="button" className="lightbox-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <button type="button" className="lightbox-nav prev" onClick={onPrev} aria-label="Foto anterior">
          ‹
        </button>
        <img src={current.url} alt={current.originalName} className="lightbox-image" />
        <button type="button" className="lightbox-nav next" onClick={onNext} aria-label="Foto siguiente">
          ›
        </button>
        <div className="lightbox-caption">{current.originalName}</div>
      </div>
    </div>
  );
};

export default LightboxModal;
