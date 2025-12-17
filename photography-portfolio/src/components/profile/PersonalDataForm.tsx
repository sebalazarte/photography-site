import { useEffect, useState } from 'react';
import type React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useContactProfile } from '../../context/ContactProfileContext';
import { updateSiteProfile } from '../../api/site';

type PersonalDataFormState = {
  name: string;
  email: string;
  phone: string;
};

const emptyForm: PersonalDataFormState = {
  name: '',
  email: '',
  phone: '',
};

const PersonalDataForm: React.FC = () => {
  const { user } = useAuth();
  const { profile, refresh: refreshContact } = useContactProfile();
  const [form, setForm] = useState<PersonalDataFormState>(emptyForm);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      setForm(emptyForm);
      return;
    }
    setForm({
      name: profile.name ?? '',
      email: profile.email ?? '',
      phone: profile.phone ?? '',
    });
  }, [profile?.id, profile?.name, profile?.email, profile?.phone]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setStatus('idle');
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !profile) return;
    try {
      setStatus('saving');
      setError(null);
      await updateSiteProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      await refreshContact();
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
          <h2 className="h6 mb-1">Datos personales</h2>
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

        <div>
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
