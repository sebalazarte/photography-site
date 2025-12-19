import { useState } from 'react';
import type React from 'react';
import { useAuth } from '../context/AuthContext';
import ContactPhotoManager from '../components/photos/ContactPhotoManager';
import { useSite } from '../context/SiteContext';
import { formatWhatsappLink } from '../utils/contact';
import { updateSiteProfile } from '../api/site';
import { improveContactDescription } from '../api/ai';
import { EditIcon, SparklesIcon } from '../types/icons';

const Contact: React.FC = () => {
  const { user } = useAuth();
  const { site, loading, error: siteError, refresh: refreshSite } = useSite();
  const contactName = site?.name ?? site?.username ?? 'Contacto';
  const email = site?.email;
  const phoneLabel = site?.phone ?? site?.whatsapp;
  const whatsappLink = formatWhatsappLink(site?.whatsapp);
  const hasContactMethods = Boolean(email || (whatsappLink && phoneLabel));
  const aboutContent = (site?.about ?? '').trim() || '';
  const aboutParagraphs = aboutContent
    .split(/\r?\n\s*\r?\n/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean);
  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutDraft, setAboutDraft] = useState(site?.about ?? '');
  const [aboutStatus, setAboutStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [aboutError, setAboutError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<'idle' | 'working'>('idle');
  const [aiError, setAiError] = useState<string | null>(null);
  const isAiWorking = aiStatus === 'working';
  const isSavingAbout = aboutStatus === 'saving';
  const isFormBusy = isAiWorking || isSavingAbout;

  const startEditing = () => {
    setAboutDraft(site?.about ?? '');
    setAboutError(null);
    setAboutStatus('idle');
    setAiStatus('idle');
    setAiError(null);
    setEditingAbout(true);
  };

  const cancelEditing = () => {
    setEditingAbout(false);
    setAboutDraft(site?.about ?? '');
    setAboutError(null);
    setAboutStatus('idle');
    setAiStatus('idle');
    setAiError(null);
  };

  const handleAboutSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !site) return;
    try {
      setAboutStatus('saving');
      setAboutError(null);
      setAiError(null);
      setAiStatus('idle');
      await updateSiteProfile({ about: aboutDraft.trim() });
      await refreshSite();
      setAboutStatus('success');
      setEditingAbout(false);
    } catch (err) {
      console.error('No se pudo actualizar la descripción de contacto', err);
      const message = err instanceof Error ? err.message : 'No se pudo actualizar la descripción.';
      setAboutError(message);
      setAboutStatus('error');
    }
  };

  const handleImproveAbout = async () => {
    if (aiStatus === 'working') return;
    const trimmedDraft = aboutDraft.trim();
    if (!trimmedDraft) {
      setAiError('Agrega una descripción antes de solicitar mejoras.');
      return;
    }
    try {
      setAiStatus('working');
      setAiError(null);
      const improved = await improveContactDescription(trimmedDraft);
      setAboutDraft(improved);
    } catch (err) {
      console.error('No se pudo mejorar la descripción con IA', err);
      const message = err instanceof Error ? err.message : 'No se pudo mejorar el texto.';
      setAiError(message);
    } finally {
      setAiStatus('idle');
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
                    disabled={isFormBusy}
                  />
                  <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                      onClick={handleImproveAbout}
                      disabled={isFormBusy}
                    >
                      <SparklesIcon aria-hidden="true" width={14} height={14} />
                      {isAiWorking ? 'Mejorando…' : 'Mejorar con IA'}
                    </button>
                    <span className="text-secondary small">
                      Obtén una versión más profesional sin salir del editor.
                    </span>
                  </div>
                  {aboutError && (
                    <div className="alert alert-danger mb-0" role="alert">
                      {aboutError}
                    </div>
                  )}
                  {aiError && (
                    <div className="alert alert-warning mb-0" role="alert">
                      {aiError}
                    </div>
                  )}
                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={cancelEditing}
                      disabled={isFormBusy}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isFormBusy}>
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
                    <span className="d-inline-flex align-items-center gap-1">
                      <EditIcon aria-hidden="true" width={14} height={14} />
                      Editar descripción
                    </span>
                  </button>
                )}
              </>
            )}
            
            <hr/>
            <section>
              <p className="text-secondary mb-4">Podés escribirme o enviar un mensaje directo.</p>
              {loading && <span className="text-secondary small">Cargando datos de contacto...</span>}
              {siteError && <span className="text-danger small">{siteError}</span>}
              {!loading && !siteError && !hasContactMethods && (
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
