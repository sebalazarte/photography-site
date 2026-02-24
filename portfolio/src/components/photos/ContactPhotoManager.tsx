import { useRef, useState } from 'react';
import type React from 'react';
import { useFolderPhotos } from '../../hooks/useFolderPhotos';
import { CONTACT_FOLDER } from '../../constants';
import { deletePhotoFromFolder, uploadToFolder } from '../../api/photos';
import { PhotoRemoveIcon, PhotoSwapIcon } from '../../types/icons';

interface ContactPhotoManagerProps {
  contactName: string;
  isEditable: boolean;
}

const ContactPhotoManager: React.FC<ContactPhotoManagerProps> = ({ contactName, isEditable }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const { photos, setPhotos, loading, error } = useFolderPhotos(CONTACT_FOLDER);
  const mainPhoto = photos[0];

  const resetInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    try {
      setStatus('saving');
      if (mainPhoto) {
        await deletePhotoFromFolder(CONTACT_FOLDER, mainPhoto.id);
      }
      const updated = await uploadToFolder(CONTACT_FOLDER, [selected]);
      setPhotos(updated);
      setStatus('idle');
    } catch (err) {
      console.error('No se pudo subir la foto de contacto', err);
      setStatus('error');
    } finally {
      resetInput();
    }
  };

  const handleRemovePhoto = async () => {
    if (!mainPhoto) return;
    try {
      setStatus('saving');
      const updated = await deletePhotoFromFolder(CONTACT_FOLDER, mainPhoto.id);
      setPhotos(updated);
      setStatus('idle');
    } catch (err) {
      console.error('No se pudo eliminar la foto de contacto', err);
      setStatus('error');
    } finally {
      resetInput();
    }
  };

  return (
    <div className="card shadow-sm text-center">
      <div className="card-body d-flex flex-column gap-3">
        <div className="contact-photo-frame">
          {loading ? (
            <span className="text-secondary">Cargando…</span>
          ) : mainPhoto ? (
            <img src={mainPhoto.url} alt={contactName} />
          ) : (
            <span className="text-secondary">Sin foto</span>
          )}
        </div>

        {error && !loading && isEditable && (
          <span className="text-danger small">{error}</span>
        )}

        {isEditable && (
          <div className="d-flex flex-column gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoSelect}
            />
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={status === 'saving'}
            >
              <span className="d-inline-flex align-items-center gap-1">
                <PhotoSwapIcon aria-hidden="true" width={14} height={14} />
                {mainPhoto ? 'Cambiar foto' : 'Subir foto'}
              </span>
            </button>
            {mainPhoto && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={handleRemovePhoto}
                disabled={status === 'saving'}
              >
                <span className="d-inline-flex align-items-center gap-1">
                  <PhotoRemoveIcon aria-hidden="true" width={14} height={14} />
                  Quitar foto
                </span>
              </button>
            )}
            {status === 'saving' && <span className="text-info small">Guardando…</span>}
            {status === 'error' && <span className="text-danger small">No se pudo procesar la imagen.</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactPhotoManager;
