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
          <textarea
            placeholder="Escribe aquí tu texto..."
            value={data.text}
            onChange={e => setData(prev => ({ ...prev, text: e.target.value }))}
            className="form-control"
            style={{ minHeight: 220, resize: 'vertical' }}
          />

          <div className="mt-3 d-flex align-items-center gap-2">
            <button onClick={save} className="btn btn-primary">Guardar</button>
            {saved && <span className="text-success">Guardado</span>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
