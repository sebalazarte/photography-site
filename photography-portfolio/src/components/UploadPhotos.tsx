import React, { useState, useCallback, useRef, useEffect, useId } from 'react';
import { appendPhotos, listPhotos, removePhoto as removeStoredPhoto, type StoredPhoto } from '../utils/photoStorage';

const createId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

interface UploadPhotosProps {
  folder: string;
  onPhotosChange?: (photos: StoredPhoto[]) => void;
  showPreview?: boolean;
}

const UploadPhotos: React.FC<UploadPhotosProps> = ({ folder, onPhotosChange, showPreview = true }) => {
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const processedKeysRef = useRef<Set<string>>(new Set());
  const inputId = useId();

  useEffect(() => {
    const existing = listPhotos(folder);
    setPhotos(existing);
    processedKeysRef.current = new Set();
  }, [folder]);

  const sync = (next: StoredPhoto[]) => {
    setPhotos(next);
    onPhotosChange?.(next);
  };

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
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const batchKeys = new Set<string>();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.match('image.*')) {
        alert(`${file.name} is not an image file. Please select only image files.`);
        continue;
      }

      const key = `${file.name}_${file.size}_${file.lastModified}`;
      if (batchKeys.has(key) || processedKeysRef.current.has(key)) {
        continue; // skip duplicates within batch or already processed
      }
      batchKeys.add(key);
      processedKeysRef.current.add(key);

      setUploadProgress(0);

      const reader = new FileReader();
      reader.onload = (e) => {
        const newPhoto: StoredPhoto = {
          id: createId(),
          name: file.name,
          url: e.target?.result as string,
          date: new Date().toISOString(),
        };

        const finalize = () => {
          const current = listPhotos(folder);
          if (current.some(p => p.url === newPhoto.url)) {
            sync(current);
            return;
          }
          const result = appendPhotos(folder, [newPhoto]);
          if (!result) {
            alert('No hay espacio suficiente en el navegador para guardar más fotos. Elimina algunas antes de continuar.');
            sync(current);
            return;
          }
          sync(result);
        };

        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev === null) return 0;
            if (prev >= 100) {
              clearInterval(interval);
              finalize();
              return null;
            }
            return prev + 10;
          });
        }, 100);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (id: string) => {
    const result = removeStoredPhoto(folder, id);
    if (!result) {
      alert('No pudimos actualizar el almacenamiento. Intenta nuevamente.');
      return;
    }
    sync(result);
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

      {uploadProgress !== null && (
        <div className="upload-progress">
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress}>
            <div
              className="progress-bar"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <span className="progress-text">Subiendo... {uploadProgress}%</span>
        </div>
      )}

      {showPreview && photos.length > 0 && (
        <div className="uploaded-photos">
          <h3 className="h5 mb-3">Fotos subidas ({photos.length})</h3>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
            {photos.map(photo => (
              <div key={photo.id} className="col">
                <div className="photo-item card h-100">
                  <img src={photo.url} alt={photo.name} className="card-img-top" />
                  <div className="photo-info card-body d-flex justify-content-between align-items-center">
                    <span className="photo-name" title={photo.name}>{photo.name}</span>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removePhoto(photo.id)}
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