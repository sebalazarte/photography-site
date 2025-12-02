import React, { useState, useCallback } from 'react';

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
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check if it's an image file
      if (!file.type.match('image.*')) {
        alert(`${file.name} is not an image file. Please select only image files.`);
        continue;
      }

      // Simulate upload progress
      setUploadProgress(0);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const newPhoto: Photo = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          url: e.target?.result as string,
          date: new Date(),
        };
        
        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev === null) return 0;
            if (prev >= 100) {
              clearInterval(interval);
              setPhotos(prevPhotos => [...prevPhotos, newPhoto]);
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
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          <div className="upload-icon">📷</div>
          <h3>Upload Your Photos</h3>
          <p>Drag & drop your images here, or click to browse</p>
          <input 
            type="file" 
            id="file-input" 
            accept="image/*" 
            multiple 
            onChange={handleFileInput}
            style={{ display: 'none' }} 
          />
          <button 
            className="upload-button"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            Select Photos
          </button>
        </div>
      </div>

      {uploadProgress !== null && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <span className="progress-text">Uploading... {uploadProgress}%</span>
        </div>
      )}

      {photos.length > 0 && (
        <div className="uploaded-photos">
          <h3>Uploaded Photos ({photos.length})</h3>
          <div className="photo-grid">
            {photos.map(photo => (
              <div key={photo.id} className="photo-item">
                <img src={photo.url} alt={photo.name} />
                <div className="photo-info">
                  <span className="photo-name">{photo.name}</span>
                  <button 
                    className="remove-button" 
                    onClick={() => removePhoto(photo.id)}
                  >
                    Remove
                  </button>
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