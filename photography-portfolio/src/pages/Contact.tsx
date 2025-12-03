import { useRef, useState } from 'react';
import type React from 'react';
import { CONTACT_EMAIL, CONTACT_NAME, CONTACT_PHONE, CONTACT_PHONE_WHATSAPP } from '../config/contact';
import { useAuth } from '../context/AuthContext';
import { useFolderPhotos } from '../hooks/useFolderPhotos';
import { CONTACT_FOLDER } from '../constants';
import { deletePhotoFromFolder, uploadToFolder } from '../api/photos';

const Contact: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();
  const { photos, setPhotos, loading, error } = useFolderPhotos(CONTACT_FOLDER);
  const mainPhoto = photos[0];

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    try {
      setStatus('saving');
      const updated = await uploadToFolder(CONTACT_FOLDER, event.target.files);
      setPhotos(updated);
      setStatus('idle');
    } catch (err) {
      console.error('No se pudo subir la foto de contacto', err);
      setStatus('error');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!mainPhoto) return;
    try {
      setStatus('saving');
      const updated = await deletePhotoFromFolder(CONTACT_FOLDER, mainPhoto.filename);
      setPhotos(updated);
      setStatus('idle');
    } catch (err) {
      console.error('No se pudo eliminar la foto de contacto', err);
      setStatus('error');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="font-monospace">
      <section className="mb-5">
        <h2 className="h3 mb-3">Contacto</h2>
        <div className="row g-4 align-items-start">
          <div className="col-12 col-md-4">
            <div className="card shadow-sm text-center">
              <div className="card-body">
                {loading ? (
                  <div
                    style={{ height: 320 }}
                    className="d-grid place-items-center text-secondary bg-light rounded"
                  >
                    Cargando…
                  </div>
                ) : mainPhoto ? (
                  <img
                    src={mainPhoto.url}
                    alt={CONTACT_NAME}
                    style={{ width: '100%', height: 320, objectFit: 'contain', borderRadius: 6 }}
                  />
                ) : (
                  <div
                    style={{ height: 320 }}
                    className="d-grid place-items-center text-secondary bg-light rounded"
                  >
                    Sin foto
                  </div>
                )}
                {error && !loading && (
                  <span className="text-danger small d-block mt-2">{error}</span>
                )}
                {user && (
                  <div className="mt-3 d-flex flex-column gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handlePhotoSelect}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={status === 'saving'}
                    >
                      {mainPhoto ? 'Cambiar foto' : 'Subir foto'}
                    </button>
                    {mainPhoto && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={handleRemovePhoto}
                        disabled={status === 'saving'}
                      >
                        Quitar foto
                      </button>
                    )}
                    {status === 'saving' && <span className="text-info small">Guardando…</span>}
                    {status === 'error' && <span className="text-danger small">No se pudo procesar la imagen.</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-md-8">
            <p>Soy Licenciado en Análisis de Sistemas y durante más de 20 años me dediqué al mundo de la programación. La tecnología siempre fue parte de mi vida, pero con el tiempo sentí la necesidad de explorar nuevos caminos y encontrar un espacio donde pudiera expresarme de otra manera.</p>
            <p>En 2017 descubrí la fotografía como un pasatiempo, y pronto me di cuenta de que no era solo un hobby: era una pasión. Cada vez que tomo una cámara, no lo vivo como un trabajo, sino como una experiencia que me conecta con el entorno y las personas.</p>
            <p>Lo que comenzó como una actividad recreativa se transformó en una profesión que disfruto plenamente. Hoy combino mi formación técnica con una mirada creativa, dedicándome de manera más profesional a capturar momentos, historias y detalles que muchas veces pasan desapercibidos.</p>
            <p>Mi objetivo es capturar momentos auténticos y contar historias a través de mis imágenes, buscando siempre transmitir emociones y sensaciones que perduren en el tiempo.</p>
            <p>La fotografía me enseñó que siempre hay una nueva forma de mirar el mundo, y esa es la visión que quiero compartir contigo.</p>
            
            <hr/>
            <section>
              <p className="text-secondary mb-4">Podés escribirme o enviar un mensaje directo.</p>
              <div className="d-flex flex-column flex-md-row gap-3">
                <a className="btn btn-outline-dark" href={`mailto:${CONTACT_EMAIL}`}>
                  Email: {CONTACT_EMAIL}
                </a>
                <a
                  className="btn btn-dark"
                  href={CONTACT_PHONE_WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp: {CONTACT_PHONE}
                </a>
              </div>
            </section>
          </div>



        </div>
      </section>


    </div>
  );
};

export default Contact;
