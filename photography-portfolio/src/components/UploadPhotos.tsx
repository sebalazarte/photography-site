import React, { useState, useCallback, useEffect, useId } from 'react';
import type { StoredPhoto } from '../types/photos';
import { deletePhotoFromFolder, listFolderPhotos, uploadToFolder } from '../api/photos';

interface UploadPhotosProps {
  folder: string;
  photos?: StoredPhoto[];
  onPhotosChange?: (photos: StoredPhoto[]) => void;
  showPreview?: boolean;
}

const UploadPhotos: React.FC<UploadPhotosProps> = ({ folder, photos, onPhotosChange, showPreview = true }) => {
  const [localPhotos, setLocalPhotos] = useState<StoredPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputId = useId();

  const effectivePhotos = photos ?? localPhotos;

  const sync = useCallback((next: StoredPhoto[]) => {
    if (!photos) {
      setLocalPhotos(next);
    }
    onPhotosChange?.(next);
  }, [photos, onPhotosChange]);

  useEffect(() => {
    if (photos) return;
    listFolderPhotos(folder).then(setLocalPhotos).catch(() => setLocalPhotos([]));
  }, [folder, photos]);

  const handleFiles = useCallback(async (files: FileList) => {
    try {
      setUploading(true);
      const updated = await uploadToFolder(folder, files);
      sync(updated);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudieron subir las fotos');
    } finally {
      setUploading(false);
    }
  }, [folder, sync]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removePhoto = async (filename: string) => {
    try {
      const updated = await deletePhotoFromFolder(folder, filename);
      sync(updated);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo eliminar la foto');
    }
  };


  return (
    <div className="upload-container">
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''} card shadow-sm`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="card-body upload-content">
          <div className="upload-icon">📷</div>
          <h3 className="h4">Sube tus fotos</h3>
          <p className="text-secondary">Arrastra y suelta o haz clic para seleccionar</p>
          <input
            type="file"
            id={inputId}
            accept="image/*"
            multiple
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <button
            className="btn btn-primary"
            onClick={() => document.getElementById(inputId)?.click()}
          >
            Seleccionar fotos
          </button>
        </div>
      </div>

      {uploading && (
        <div className="upload-progress">
          <div className="progress">
            <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: '100%' }}></div>
          </div>
          <span className="progress-text">Subiendo...</span>
        </div>
      )}

      {showPreview && effectivePhotos.length > 0 && (
        <div className="uploaded-photos">
          <h3 className="h5 mb-3">Fotos subidas ({effectivePhotos.length})</h3>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
            {effectivePhotos.map(photo => (
              <div key={photo.id} className="col">
                <div className="photo-item card h-100">
                  <img src={photo.url} alt={photo.originalName} className="card-img-top" />
                  <div className="photo-info card-body d-flex justify-content-between align-items-center">
                    <span className="photo-name" title={photo.originalName}>{photo.originalName}</span>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removePhoto(photo.filename)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPhotos;