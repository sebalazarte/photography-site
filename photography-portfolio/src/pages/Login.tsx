import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '' });
  const [error, setError] = useState('');

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      setError('Completa tu nombre y email.');
      return;
    }
    login({ name: form.name, email: form.email });
    navigate('/');
  };

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-6">
        <div className="card shadow-sm">
          <div className="card-body">
            <h1 className="h4 mb-3">Iniciar sesión</h1>
            <form className="vstack gap-3" onSubmit={onSubmit}>
              <input className="form-control" placeholder="Nombre" name="name" value={form.name} onChange={onChange} />
              <input className="form-control" placeholder="Email" name="email" type="email" value={form.email} onChange={onChange} />
              {error && <span className="text-danger small">{error}</span>}
              <button className="btn btn-dark" type="submit">Entrar</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
