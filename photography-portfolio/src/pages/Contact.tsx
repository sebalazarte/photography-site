import { useEffect, useState } from 'react';
import type React from 'react';
import { CONTACT_EMAIL, CONTACT_NAME, CONTACT_PHONE, CONTACT_PHONE_WHATSAPP } from '../config/contact';

type AboutData = { photo?: string };

const ABOUT_STORAGE_KEY = 'pp_about_v1';

const Contact: React.FC = () => {
  const [aboutData, setAboutData] = useState<AboutData>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ABOUT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.photo) {
          setAboutData({ photo: parsed.photo as string });
        }
      }
    } catch (error) {
      console.warn('No se pudo cargar la foto de Acerca de mí', error);
    }
  }, []);

  return (
    <div className="font-monospace">
      <section className="mb-5">
        <h2 className="h3 mb-3">Contacto</h2>
        <div className="row g-4 align-items-start">
          <div className="col-12 col-md-4">
            <div className="card shadow-sm text-center">
              <div className="card-body">
                {aboutData.photo ? (
                  <img
                    src={aboutData.photo}
                    alt={CONTACT_NAME}
                    style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 6 }}
                  />
                ) : (
                  <div
                    style={{ height: 240 }}
                    className="d-grid place-items-center text-secondary bg-light rounded"
                  >
                    Sin foto
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
