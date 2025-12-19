import { useEffect, useState } from 'react';
import type React from 'react';
import type { CustomerRecord } from '../../api/users';

export interface CustomerFormValues {
  username: string;
  email: string;
  name: string;
  phone: string;
}

interface CustomerFormProps {
  mode: 'create' | 'edit';
  customer: CustomerRecord | null;
  onSubmit: (values: CustomerFormValues) => Promise<CustomerRecord>;
  onCancel?: () => void;
}

const emptyForm: CustomerFormValues = {
  username: '',
  email: '',
  name: '',
  phone: '',
};

const CustomerForm: React.FC<CustomerFormProps> = ({ mode, customer, onSubmit, onCancel }) => {
  const [form, setForm] = useState<CustomerFormValues>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && customer) {
      setForm({
        username: customer.username,
        email: customer.email ?? '',
        name: customer.name ?? '',
        phone: customer.phone ?? '',
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
    setSuccess(null);
  }, [mode, customer?.id]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const username = form.username.trim();
    if (!username) {
      setError('El usuario es obligatorio.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await onSubmit({
        username,
        email: form.email.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
      });
      setSuccess(`Cliente "${result.name ?? result.username}" guardado correctamente.`);
      if (mode === 'create') {
        setForm(emptyForm);
      } else {
        setForm({
          username: result.username,
          email: result.email ?? '',
          name: result.name ?? '',
          phone: result.phone ?? '',
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
        {onCancel && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            {isEdit ? 'Cancelar edición' : 'Cancelar'}
          </button>
        )}
      </div>
      <div className="card-body">
        <form className="vstack gap-3" onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-12 col-md-6">
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
            <div className="col-12 col-md-6">
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
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
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
