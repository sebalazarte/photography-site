import { useEffect, useState } from 'react';
import type React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSite } from '../../context/SiteContext';
import { updateSiteProfile } from '../../api/site';

type PersonalDataFormState = {
  name: string;
  email: string;
  phone: string;
  about: string;
};

const emptyForm: PersonalDataFormState = {
  name: '',
  email: '',
  phone: '',
  about: '',
};

const buildWhatsappLink = (phone: string) => {
  const digits = phone.replace(/\D+/g, '');
  return digits ? `https://wa.me/${digits}` : '';
};

const PersonalDataForm: React.FC = () => {
  const { user } = useAuth();
  const { site, refresh: refreshSite } = useSite();
  const [form, setForm] = useState<PersonalDataFormState>(emptyForm);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!site) {
      setForm(emptyForm);
      return;
    }
    const inferredPhone = site.phone ?? site.whatsapp ?? '';
    setForm({
      name: site.name ?? '',
      email: site.email ?? '',
      phone: inferredPhone,
      about: site.about ?? '',
    });
  }, [site?.id, site?.name, site?.email, site?.phone, site?.whatsapp, site?.about]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setStatus('idle');
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !site) return;
    try {
      setStatus('saving');
      setError(null);
      const trimmedPhone = form.phone.trim();
      await updateSiteProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: trimmedPhone,
        whatsapp: buildWhatsappLink(trimmedPhone),
        about: form.about.trim(),
      });
      await refreshSite();
      setStatus('success');
    } catch (err) {
      console.error('No se pudieron guardar los datos personales', err);
      const message = err instanceof Error ? err.message : 'No se pudieron guardar los datos personales.';
      setError(message);
      setStatus('error');
    }
  };

  if (!user) {
    return <p className="text-secondary">Inicia sesión para actualizar tus datos personales.</p>;
  }

  return (
    <form className="card shadow-sm" onSubmit={handleSubmit}>
      <div className="card-body vstack gap-3">
        <div>
          <h2 className="h6 mb-1">Datos de contacto y reseña</h2>
          <p className="text-secondary small mb-0">Actualiza la información que aparece en el sitio.</p>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label htmlFor="personal-name" className="form-label">Nombre</label>
            <input
              id="personal-name"
              name="name"
              className="form-control"
              value={form.name}
              onChange={handleChange}
              disabled={status === 'saving'}
              autoComplete="name"
            />
          </div>
          <div className="col-12 col-md-6">
            <label htmlFor="personal-email" className="form-label">Email</label>
            <input
              id="personal-email"
              name="email"
              type="email"
              className="form-control"
              value={form.email}
              onChange={handleChange}
              disabled={status === 'saving'}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label htmlFor="personal-phone" className="form-label">Teléfono</label>
            <input
              id="personal-phone"
              name="phone"
              className="form-control"
              value={form.phone}
              onChange={handleChange}
              disabled={status === 'saving'}
              autoComplete="tel"
            />
          </div>
          <div className="col-12 col-md-6">
            <label htmlFor="personal-whatsapp" className="form-label">WhatsApp</label>
            <input
              id="personal-whatsapp"
              className="form-control"
              value={buildWhatsappLink(form.phone)}
              readOnly
              placeholder="Completa un teléfono para generar el enlace"
            />
            <div className="form-text">Se genera automáticamente con el formato https://wa.me/&lt;tel&gt;.</div>
          </div>
        </div>

        <div>
          <label htmlFor="personal-about" className="form-label">Acerca de</label>
          <textarea
            id="personal-about"
            name="about"
            className="form-control"
            rows={10}
            value={form.about}
            onChange={handleChange}
            disabled={status === 'saving'}
          />
        </div>

        {error && <div className="alert alert-danger mb-0" role="alert">{error}</div>}
        {status === 'success' && !error && (
          <div className="alert alert-success mb-0" role="alert">
            Datos actualizados correctamente.
          </div>
        )}

        <div className="d-flex gap-2 justify-content-end">
          <button type="submit" className="btn btn-primary" disabled={status === 'saving'}>
            {status === 'saving' ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PersonalDataForm;
