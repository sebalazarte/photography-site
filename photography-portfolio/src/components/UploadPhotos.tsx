import React, { useState, useCallback, useRef } from 'react';

interface Photo {
  id: string;
  name: string;
  url: string;
  date: Date;
}

const UploadPhotos: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const processedKeysRef = useRef<Set<string>>(new Set());

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
        const newPhoto: Photo = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          url: e.target?.result as string,
          date: new Date(),
        };

        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev === null) return 0;
            if (prev >= 100) {
              clearInterval(interval);
              setPhotos(prevPhotos => {
                // final guard against duplicates by URL
                if (prevPhotos.some(p => p.url === newPhoto.url)) return prevPhotos;
                return [...prevPhotos, newPhoto];
              });
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
    setPhotos(prev => prev.filter(photo => photo.id !== id));
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
            id="file-input"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <button
            className="btn btn-primary"
            onClick={() => document.getElementById('file-input')?.click()}
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

      {photos.length > 0 && (
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