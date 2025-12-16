import type React from 'react';
import { useAuth } from '../context/AuthContext';
import ContactPhotoManager from '../components/ContactPhotoManager';
import { useContactProfile } from '../context/ContactProfileContext';
import { formatWhatsappLink } from '../utils/contact';

const Contact: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading, error } = useContactProfile();
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

  return (
    <div className="font-monospace">
      <section className="mb-5">
        <h2 className="h3 mb-3">Contacto</h2>
        <div className="row g-4 align-items-start">
          <div className="col-12 col-md-4">
            <ContactPhotoManager contactName={contactName} isEditable={Boolean(user)} />
          </div>

          <div className="col-12 col-md-8">
            {aboutParagraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            
            <hr/>
            <section>
              <p className="text-secondary mb-4">Podés escribirme o enviar un mensaje directo.</p>
              {loading && <span className="text-secondary small">Cargando datos de contacto...</span>}
              {error && <span className="text-danger small">{error}</span>}
              {!loading && !error && !hasContactMethods && (
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
