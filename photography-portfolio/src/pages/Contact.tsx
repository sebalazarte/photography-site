import { useState } from 'react';
import type React from 'react';
import { useAuth } from '../context/AuthContext';
import ContactPhotoManager from '../components/photos/ContactPhotoManager';
import { useContactProfile } from '../context/ContactProfileContext';
import { formatWhatsappLink } from '../utils/contact';
import { updateCustomerAccount } from '../api/users';

const Contact: React.FC = () => {
  const { user, refresh: refreshAuth } = useAuth();
  const { profile, loading, error: profileError, refresh } = useContactProfile();
  const contactName = profile?.name ?? profile?.username ?? 'Contacto';
  const email = profile?.email;
  const phoneLabel = profile?.phone ?? profile?.whatsapp;
  const whatsappLink = formatWhatsappLink(profile?.whatsapp);
  const hasContactMethods = Boolean(email || (whatsappLink && phoneLabel));
  const aboutContent = (profile?.about ?? '').trim() || '';
  const aboutParagraphs = aboutContent
    .split(/\r?\n\s*\r?\n/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean);
  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutDraft, setAboutDraft] = useState(profile?.about ?? '');
  const [aboutStatus, setAboutStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [aboutError, setAboutError] = useState<string | null>(null);

  const startEditing = () => {
    setAboutDraft(profile?.about ?? '');
    setAboutError(null);
    setAboutStatus('idle');
    setEditingAbout(true);
  };

  const cancelEditing = () => {
    setEditingAbout(false);
    setAboutDraft(profile?.about ?? '');
    setAboutError(null);
    setAboutStatus('idle');
  };

  const handleAboutSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !profile?.id) return;
    try {
      setAboutStatus('saving');
      setAboutError(null);
      await updateCustomerAccount(profile.id, { about: aboutDraft.trim() });
      await Promise.all([refresh(), refreshAuth()]);
      setAboutStatus('success');
      setEditingAbout(false);
    } catch (err) {
      console.error('No se pudo actualizar la descripción de contacto', err);
      const message = err instanceof Error ? err.message : 'No se pudo actualizar la descripción.';
      setAboutError(message);
      setAboutStatus('error');
    }
  };

  return (
    <div className="font-monospace">
      <section className="mb-5">
        <h2 className="h3 mb-3">Contacto</h2>
        <div className="row g-4 align-items-start">
          <div className="col-12 col-md-4">
            <ContactPhotoManager contactName={contactName} isEditable={Boolean(user)} />
          </div>

          <div className="col-12 col-md-8">
            {aboutStatus === 'success' && !editingAbout && (
              <div className="alert alert-success" role="alert">
                Descripción actualizada correctamente.
              </div>
            )}
            {aboutError && !editingAbout && (
              <div className="alert alert-danger" role="alert">
                {aboutError}
              </div>
            )}

            {editingAbout ? (
              <form className="card shadow-sm mb-4" onSubmit={handleAboutSubmit}>
                <div className="card-body vstack gap-3">
                  <div>
                    <h3 className="h6 mb-1">Editar descripción</h3>
                    <p className="text-secondary small mb-0">Actualiza el texto de la sección Acerca de.</p>
                  </div>
                  <textarea
                    className="form-control"
                    rows={8}
                    value={aboutDraft}
                    onChange={event => setAboutDraft(event.target.value)}
                    disabled={aboutStatus === 'saving'}
                  />
                  {aboutError && (
                    <div className="alert alert-danger mb-0" role="alert">
                      {aboutError}
                    </div>
                  )}
                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={cancelEditing}
                      disabled={aboutStatus === 'saving'}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={aboutStatus === 'saving'}>
                      {aboutStatus === 'saving' ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <>
                {aboutParagraphs.length > 0 ? (
                  aboutParagraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))
                ) : (
                  <p className="text-secondary">Aún no hay una descripción disponible.</p>
                )}
                {user && (
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={startEditing}>
                    Editar descripción
                  </button>
                )}
              </>
            )}
            
            <hr/>
            <section>
              <p className="text-secondary mb-4">Podés escribirme o enviar un mensaje directo.</p>
              {loading && <span className="text-secondary small">Cargando datos de contacto...</span>}
              {profileError && <span className="text-danger small">{profileError}</span>}
              {!loading && !profileError && !hasContactMethods && (
                <span className="text-secondary small">Los datos de contacto aún no están disponibles.</span>
              )}
              <div className="d-flex flex-column flex-md-row gap-3">
                {email && (
                  <a className="btn btn-outline-dark" href={`mailto:${email}`}>
                    Email: {email}
                  </a>
                )}
                {whatsappLink && phoneLabel && (
                  <a
                    className="btn btn-dark"
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp: {phoneLabel}
                  </a>
                )}
              </div>
            </section>
          </div>



        </div>
      </section>


    </div>
  );
};

export default Contact;
