import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sha256 } from '../utils/hash';
import { ADMIN_PASSWORD_HASH, ADMIN_PROFILE, ADMIN_USERNAME } from '../config/auth';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) {
      setError('Ingresa un usuario y contraseña.');
      return;
    }
    setVerifying(true);
    try {
      const hashed = await sha256(form.password);
      const isValid = form.username.trim().toLowerCase() === ADMIN_USERNAME && hashed === ADMIN_PASSWORD_HASH;
      if (!isValid) {
        setError('Credenciales inválidas.');
        return;
      }
      login({ name: ADMIN_PROFILE.name, email: ADMIN_PROFILE.email });
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('No se pudo verificar las credenciales.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-6">
        <div className="card shadow-sm">
          <div className="card-body">
            <h1 className="h4 mb-3">Iniciar sesión</h1>
            <form className="vstack gap-3" onSubmit={onSubmit}>
              <input
                className="form-control"
                placeholder="Usuario"
                name="username"
                autoComplete="username"
                value={form.username}
                onChange={onChange}
              />
              <input
                className="form-control"
                placeholder="Contraseña"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={onChange}
              />
              {error && <span className="text-danger small">{error}</span>}
              <button className="btn btn-dark" type="submit" disabled={verifying}>
                {verifying ? 'Verificando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
