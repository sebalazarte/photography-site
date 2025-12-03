import { useEffect, useState } from 'react';
import type React from 'react';

type AboutData = {
  photo?: string;
  text: string;
};

const STORAGE_KEY = 'pp_about_v1';

const About: React.FC = () => {
  const [data, setData] = useState<AboutData>({ text: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, []);

  const onUpload = (file: File | null) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setData(prev => ({ ...prev, photo: r.result as string }));
    r.readAsDataURL(file);
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  return (
    <div>
      <h2 className="h3 mb-1">Acerca de mí</h2>
      <p className="text-secondary">Sube una foto y escribe una breve biografía.</p>

      <div className="row g-4 align-items-start">
        <section className="col-12 col-md-4">
          <div className="card shadow-sm text-center">
            <div className="card-body">
              {data.photo ? (
                <img src={data.photo} alt="about" style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 6, marginBottom: '0.5rem' }} />
              ) : (
                <div style={{ height: 240 }} className="d-grid place-items-center text-secondary">Sin foto</div>
              )}
              <label>
                <input type="file" accept="image/*" onChange={e => onUpload(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
                <span className="btn btn-outline-secondary">{data.photo ? 'Cambiar foto' : 'Subir foto'}</span>
              </label>
            </div>
          </div>
        </section>

        <section className="col-12 col-md-8">
          <p>Soy Licenciado en Análisis de Sistemas y durante más de 20 años me dediqué al mundo de la programación. La tecnología siempre fue parte de mi vida, pero con el tiempo sentí la necesidad de explorar nuevos caminos y encontrar un espacio donde pudiera expresarme de otra manera.</p>
          <p>En 2017 descubrí la fotografía como un pasatiempo, y pronto me di cuenta de que no era solo un hobby: era una pasión. Cada vez que tomo una cámara, no lo vivo como un trabajo, sino como una experiencia que me conecta con el entorno y las personas.</p>
          <p>Lo que comenzó como una actividad recreativa se transformó en una profesión que disfruto plenamente. Hoy combino mi formación técnica con una mirada creativa, dedicándome de manera más profesional a capturar momentos, historias y detalles que muchas veces pasan desapercibidos.</p>
          <p>Mi objetivo es capturar momentos auténticos y contar historias a través de mis imágenes, buscando siempre transmitir emociones y sensaciones que perduren en el tiempo.</p>
          <p>La fotografía me enseñó que siempre hay una nueva forma de mirar el mundo, y esa es la visión que quiero compartir contigo.</p>
        </section>
      </div>
    </div>
  );
};

export default About;
