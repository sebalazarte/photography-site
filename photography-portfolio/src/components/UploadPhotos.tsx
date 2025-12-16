import React, { useState, useCallback, useEffect, useId } from 'react';
import type { StoredPhoto } from '../types/photos';
import { deletePhotoFromFolder, listFolderPhotos, updatePhotoOrder, uploadToFolder } from '../api/photos';

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
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
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

  const handleFiles = useCallback(async (filesInput: FileList | File[]) => {
    try {
      setUploading(true);
      const updated = await uploadToFolder(folder, filesInput);
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
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dt = e.dataTransfer;
    if (!dt) return;

    let files: FileList | File[] | null = null;
    if (dt.files && dt.files.length > 0) {
      files = dt.files;
    } else if (dt.items && dt.items.length > 0) {
      const extracted = Array.from(dt.items)
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile())
        .filter((file): file is File => Boolean(file));
      if (extracted.length > 0) {
        files = extracted;
      }
    }

    if (files && files.length > 0) {
      void handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removePhoto = async (photoId: string) => {
    try {
      const updated = await deletePhotoFromFolder(folder, photoId);
      sync(updated);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo eliminar la foto');
    }
  };

  const handlePhotoDragStart = useCallback((event: React.DragEvent<HTMLDivElement>, photoId: string) => {
    if (savingOrder) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', photoId);
    setDraggedId(photoId);
  }, [savingOrder]);

  const handlePhotoDragOver = useCallback((event: React.DragEvent<HTMLDivElement>, photoId: string) => {
    if (!draggedId || draggedId === photoId) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dragOverId !== photoId) {
      setDragOverId(photoId);
    }
  }, [draggedId, dragOverId]);

  const handlePhotoDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>, photoId: string) => {
    event.preventDefault();
    if (dragOverId === photoId) {
      setDragOverId(null);
    }
  }, [dragOverId]);

  const handlePhotoDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  const handlePhotoDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (!draggedId || draggedId === targetId) {
      setDragOverId(null);
      setDraggedId(null);
      return;
    }

    const previousOrder = [...effectivePhotos];
    const fromIndex = previousOrder.findIndex(photo => photo.id === draggedId);
    const toIndex = previousOrder.findIndex(photo => photo.id === targetId);

    if (fromIndex === -1 || toIndex === -1) {
      setDragOverId(null);
      setDraggedId(null);
      return;
    }

    const reordered = [...previousOrder];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    sync(reordered);

    try {
      setSavingOrder(true);
      const refreshed = await updatePhotoOrder(folder, reordered.map(photo => photo.id));
      sync(refreshed);
    } catch (error) {
      console.error('No se pudo guardar el nuevo orden de fotos', error);
      alert(error instanceof Error ? error.message : 'No se pudo guardar el nuevo orden de fotos');
      sync(previousOrder);
    } finally {
      setSavingOrder(false);
      setDragOverId(null);
      setDraggedId(null);
    }
  }, [draggedId, effectivePhotos, folder, sync]);


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
          <p className="text-secondary small mb-2">Arrastra y suelta para modificar el orden de las fotos.</p>
          {savingOrder && <p className="text-info small mb-3">Guardando nuevo orden…</p>}
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
            {effectivePhotos.map(photo => {
              const isDraggingThis = draggedId === photo.id;
              const isDragOver = dragOverId === photo.id;
              const cardClasses = `photo-item card h-100 draggable${isDraggingThis ? ' is-dragging' : ''}${isDragOver ? ' drag-over' : ''}`;

              return (
                <div key={photo.id} className="col">
                  <div
                    className={cardClasses}
                    draggable={!uploading && !savingOrder}
                    onDragStart={(event) => handlePhotoDragStart(event, photo.id)}
                    onDragOver={(event) => handlePhotoDragOver(event, photo.id)}
                    onDragLeave={(event) => handlePhotoDragLeave(event, photo.id)}
                    onDrop={(event) => void handlePhotoDrop(event, photo.id)}
                    onDragEnd={handlePhotoDragEnd}
                    role="button"
                    aria-grabbed={isDraggingThis}
                    tabIndex={0}
                  >
                  <img src={photo.url} alt={photo.originalName} className="card-img-top" />
                  <div className="photo-info card-body d-flex justify-content-between align-items-center">
                    <span className="photo-name" title={photo.originalName}>{photo.originalName}</span>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removePhoto(photo.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPhotos;