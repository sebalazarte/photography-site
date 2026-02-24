import { useState } from 'react';
import type React from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateCustomerAccount } from '../../api/users';

const ChangePasswordForm: React.FC = () => {
  const { user, refresh } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return <p className="text-secondary">Inicia sesión para cambiar tu contraseña.</p>;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();
    if (!trimmedNew) {
      setError('Debes ingresar una nueva contraseña.');
      setStatus('error');
      return;
    }
    if (trimmedNew.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      setStatus('error');
      return;
    }
    if (trimmedNew !== trimmedConfirm) {
      setError('Las contraseñas no coinciden.');
      setStatus('error');
      return;
    }

    try {
      setStatus('saving');
      setError(null);
      await updateCustomerAccount(user.id, { password: trimmedNew });
      await refresh();
      setStatus('success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('No se pudo actualizar la contraseña', err);
      const message = err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.';
      setError(message);
      setStatus('error');
    }
  };

  return (
    <form className="card shadow-sm" onSubmit={handleSubmit}>
      <div className="card-body vstack gap-3">
        <div>
          <h2 className="h6 mb-1">Cambiar contraseña</h2>
          <p className="text-secondary small mb-0">Define y confirma una nueva contraseña para tu cuenta.</p>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label htmlFor="new-password" className="form-label">Nueva contraseña</label>
            <input
              id="new-password"
              type="password"
              className="form-control"
              value={newPassword}
              onChange={event => {
                setNewPassword(event.target.value);
                setStatus('idle');
                setError(null);
              }}
              disabled={status === 'saving'}
              autoComplete="new-password"
            />
          </div>
          <div className="col-12 col-md-6">
            <label htmlFor="confirm-password" className="form-label">Repetir contraseña</label>
            <input
              id="confirm-password"
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={event => {
                setConfirmPassword(event.target.value);
                setStatus('idle');
                setError(null);
              }}
              disabled={status === 'saving'}
              autoComplete="new-password"
            />
          </div>
        </div>

        {error && <div className="alert alert-danger mb-0" role="alert">{error}</div>}
        {status === 'success' && !error && (
          <div className="alert alert-success mb-0" role="alert">
            Contraseña actualizada correctamente.
          </div>
        )}

        <div className="d-flex gap-2 justify-content-end">
          <button type="submit" className="btn btn-primary" disabled={status === 'saving'}>
            {status === 'saving' ? 'Guardando…' : 'Actualizar contraseña'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
