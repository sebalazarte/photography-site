import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import type { CustomerRecord } from '../../api/users';

export interface CustomerFormValues {
  username: string;
  password: string;
  email: string;
  name: string;
  phone: string;
  whatsapp: string;
  about: string;
}

interface CustomerFormProps {
  mode: 'create' | 'edit';
  customer: CustomerRecord | null;
  onSubmit: (values: CustomerFormValues) => Promise<CustomerRecord>;
  onCancelEdit?: () => void;
}

const emptyForm: CustomerFormValues = {
  username: '',
  password: '',
  email: '',
  name: '',
  phone: '',
  whatsapp: '',
  about: '',
};

const CustomerForm: React.FC<CustomerFormProps> = ({ mode, customer, onSubmit, onCancelEdit }) => {
  const [form, setForm] = useState<CustomerFormValues>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && customer) {
      setForm({
        username: customer.username,
        password: '',
        email: customer.email ?? '',
        name: customer.name ?? '',
        phone: customer.phone ?? '',
        whatsapp: customer.whatsapp ?? '',
        about: customer.about ?? '',
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
    setSuccess(null);
  }, [mode, customer?.id]);

  const phoneDigits = useMemo(() => form.phone.replace(/\D+/g, ''), [form.phone]);
  const whatsappValue = phoneDigits ? `https://wa.me/${phoneDigits}` : '';

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const username = form.username.trim();
    const password = form.password.trim();
    if (!username) {
      setError('El usuario es obligatorio.');
      return;
    }
    if (mode === 'create' && !password) {
      setError('La contraseña es obligatoria para un nuevo cliente.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await onSubmit({
        username,
        password,
        email: form.email.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        whatsapp: whatsappValue,
        about: form.about.trim(),
      });
      setSuccess(`Cliente "${result.name ?? result.username}" guardado correctamente.`);
      if (mode === 'create') {
        setForm(emptyForm);
      } else {
        setForm({
          username: result.username,
          password: '',
          email: result.email ?? '',
          name: result.name ?? '',
          phone: result.phone ?? '',
          whatsapp: result.whatsapp ?? '',
          about: result.about ?? '',
        });
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('No se pudo guardar el cliente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isEdit = mode === 'edit';

  return (
    <div className="card shadow-sm h-100">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h2 className="h6 mb-0">{isEdit ? 'Editar cliente' : 'Nuevo cliente'}</h2>
        {isEdit && onCancelEdit && (
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCancelEdit} disabled={submitting}>
            Cancelar edición
          </button>
        )}
      </div>
      <div className="card-body">
        <form className="vstack gap-3" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="form-label">Usuario *</label>
            <input
              id="username"
              name="username"
              className="form-control"
              value={form.username}
              onChange={handleChange}
              autoComplete="off"
              disabled={submitting || isEdit}
            />
          </div>

          <div>
            <label htmlFor="password" className="form-label">{isEdit ? 'Nueva contraseña' : 'Contraseña *'}</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder={isEdit ? 'Ingresa una nueva contraseña para actualizarla (opcional)' : undefined}
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="name" className="form-label">Nombre</label>
            <input
              id="name"
              name="name"
              className="form-control"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              disabled={submitting}
            />
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label htmlFor="phone" className="form-label">Teléfono</label>
              <input
                id="phone"
                name="phone"
                className="form-control"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
                disabled={submitting}
              />
            </div>
            <div className="col-12 col-md-6">
              <label htmlFor="whatsapp" className="form-label">WhatsApp (generado)</label>
              <input
                id="whatsapp"
                name="whatsapp"
                className="form-control"
                value={whatsappValue}
                readOnly
              />
            </div>
          </div>

          <div>
            <label htmlFor="about" className="form-label">Acerca de</label>
            <textarea
              id="about"
              name="about"
              className="form-control"
              rows={8}
              value={form.about}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          {success && <div className="alert alert-success" role="alert">{success}</div>}

          <button type="submit" className="btn btn-dark" disabled={submitting}>
            {submitting ? 'Guardando...' : isEdit ? 'Actualizar cliente' : 'Registrar cliente'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
