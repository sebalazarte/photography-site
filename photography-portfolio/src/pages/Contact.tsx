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

  return (
    <div className="font-monospace">
      <section className="mb-5">
        <h2 className="h3 mb-3">Contacto</h2>
        <div className="row g-4 align-items-start">
          <div className="col-12 col-md-4">
            <ContactPhotoManager contactName={contactName} isEditable={Boolean(user)} />
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
